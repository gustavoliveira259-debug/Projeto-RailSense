package br.com.railsense_backend.service;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import br.com.railsense_backend.client.ImageBytesFetcher;
import br.com.railsense_backend.client.cloudinary.CloudinaryService;
import br.com.railsense_backend.client.cloudinary.CloudinaryUploadResult;
import br.com.railsense_backend.client.gemini.GeminiClient;
import br.com.railsense_backend.dto.response.ImageUploadResponse;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.models.Analise;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Imagem;
import br.com.railsense_backend.repository.AnaliseRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.ImagemRepository;

@Service
public class ImageService {

    private final ImagemRepository imagens;
    private final AnaliseRepository analises;
    private final EixoRepository eixos;
    private final CloudinaryService cloudinaryService;
    private final GeminiClient geminiClient;
    private final GeminiResponseParser responseParser;
    private final ImageBytesFetcher bytesFetcher;
    private final AlertaService alertaService;
    private final ImageFileValidator fileValidator;

    public ImageService(ImagemRepository imagens, AnaliseRepository analises, EixoRepository eixos,
            CloudinaryService cloudinaryService, GeminiClient geminiClient,
            GeminiResponseParser responseParser, ImageBytesFetcher bytesFetcher,
            AlertaService alertaService, ImageFileValidator fileValidator) {
        this.imagens = imagens;
        this.analises = analises;
        this.eixos = eixos;
        this.cloudinaryService = cloudinaryService;
        this.geminiClient = geminiClient;
        this.responseParser = responseParser;
        this.bytesFetcher = bytesFetcher;
        this.alertaService = alertaService;
        this.fileValidator = fileValidator;
    }

    @Transactional
    public ImageUploadResponse uploadImagem(MultipartFile file, Long eixoId) {
        String mimeType = fileValidator.validar(file);
        Eixo eixo = eixos.findById(eixoId).orElseThrow(() -> new EixoNotFoundException(eixoId));
        if (!eixo.isAtivo()) {
            throw new RegraNegocioException("O eixo " + eixoId + " está desativado e não recebe imagens.");
        }

        CloudinaryUploadResult uploadResult = cloudinaryService.upload(file);
        removerDoCloudinarySeReverter(uploadResult.publicId());

        Imagem imagem = imagens.save(Imagem.builder()
                .eixo(eixo)
                .urlArquivo(uploadResult.url())
                .publicId(uploadResult.publicId())
                .mimeType(mimeType)
                .timestampCaptura(Instant.now())
                .ehBaseline(false)
                .baselineAtiva(false)
                .build());

        Optional<Imagem> baseline = imagens.findByEixoIdAndBaselineAtivaTrue(eixoId);
        if (baseline.isEmpty()) {
            return new ImageUploadResponse(imagem.getId(), imagem.getUrlArquivo(), null, null, null, null);
        }

        Analise analise = analisar(imagem, baseline.get(), file);
        Long alertaId = alertaService.avaliarEGerarAlerta(analise)
                .map(br.com.railsense_backend.models.Alerta::getId)
                .orElse(null);

        return new ImageUploadResponse(imagem.getId(), imagem.getUrlArquivo(),
                analise.getId(), analise.getClassificacao(), analise.getScoreDiferenca(), alertaId);
    }

    /**
     * O Cloudinary não participa da transação do banco: se ela for revertida (falha no
     * Gemini, no banco ou no commit), a imagem já enviada ficaria órfã. Remove após o rollback.
     */
    private void removerDoCloudinarySeReverter(String publicId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    cloudinaryService.delete(publicId);
                }
            }
        });
    }

    private Analise analisar(Imagem imagemAtual, Imagem baseline, MultipartFile currentFile) {
        try {
            byte[] currentBytes = currentFile.getBytes();
            byte[] baselineBytes = bytesFetcher.fetch(baseline.getUrlArquivo());

            Map<String, Object> geminiResponse = geminiClient.compareImages(
                    baselineBytes, baseline.getMimeType(),
                    currentBytes, imagemAtual.getMimeType(),
                    ImageAnalysisPrompt.COMPARACAO_BASELINE);

            GeminiResponseParser.ParsedAnalysis parsed = responseParser.parse(geminiResponse);

            return analises.save(Analise.builder()
                    .imagemAtual(imagemAtual)
                    .imagemBaseline(baseline)
                    .scoreDiferenca(parsed.scoreDiferenca())
                    .classificacao(parsed.classificacao())
                    .regioesAnomalia(Map.of("regioes", parsed.regioesAnomalia()))
                    .respostaBruta(geminiResponse)
                    .build());
        } catch (IOException e) {
            throw new br.com.railsense_backend.exception.GeminiAnalysisException(
                    "Falha ao ler bytes da imagem atual", e);
        }
    }

    @Transactional
    public void marcarComoBaseline(Long imagemId) {
        Imagem imagem = imagens.findById(imagemId)
                .orElseThrow(() -> new br.com.railsense_backend.exception.ImageNotFoundException(imagemId));

        imagens.findByEixoIdAndBaselineAtivaTrue(imagem.getEixo().getId())
                .ifPresent(antiga -> {
                    antiga.setBaselineAtiva(false);
                    // Grava já: no flush do commit, o UPDATE da nova baseline (carregada antes)
                    // sairia primeiro e violaria idx_baseline_ativa_unica.
                    imagens.saveAndFlush(antiga);
                });

        imagem.setEhBaseline(true);
        imagem.setBaselineAtiva(true);
        imagens.save(imagem);
    }
}