package br.com.railsense_backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import br.com.railsense_backend.exception.ArquivoInvalidoException;

/**
 * Valida o upload pelo conteúdo real (assinatura dos primeiros bytes), sem confiar
 * no Content-Type enviado pelo cliente. Aceita apenas formatos suportados pelo Gemini.
 */
@Component
public class ImageFileValidator {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP = {'W', 'E', 'B', 'P'};

    /** Retorna o MIME type detectado; lança ArquivoInvalidoException se não for imagem aceita. */
    public String validar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ArquivoInvalidoException("Arquivo de imagem ausente ou vazio.");
        }
        byte[] cabecalho = lerCabecalho(file);
        if (comecaCom(cabecalho, JPEG, 0)) {
            return "image/jpeg";
        }
        if (comecaCom(cabecalho, PNG, 0)) {
            return "image/png";
        }
        if (comecaCom(cabecalho, RIFF, 0) && comecaCom(cabecalho, WEBP, 8)) {
            return "image/webp";
        }
        throw new ArquivoInvalidoException("Formato não suportado. Envie JPEG, PNG ou WEBP.");
    }

    private static byte[] lerCabecalho(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(12);
        } catch (IOException e) {
            throw new ArquivoInvalidoException("Não foi possível ler o arquivo enviado.");
        }
    }

    private static boolean comecaCom(byte[] dados, byte[] assinatura, int offset) {
        return dados.length >= offset + assinatura.length
            && Arrays.equals(dados, offset, offset + assinatura.length, assinatura, 0, assinatura.length);
    }
}
