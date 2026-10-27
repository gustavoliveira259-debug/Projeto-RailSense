package br.com.railsense_backend.service;

import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.request.AlterarSenhaRequest;
import br.com.railsense_backend.dto.request.AtualizarUsuarioRequest;
import br.com.railsense_backend.dto.request.CriarUsuarioRequest;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.dto.response.UsuarioResponse;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.exception.UsuarioNotFoundException;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private static final String EMAIL_EM_USO = "Já existe um usuário com esse e-mail.";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PageResponse<UsuarioResponse> listar(Pageable pageable) {
        // Ordenação fixa: ?sort= do cliente é ignorado para não permitir ordenar por hashSenha.
        var pagina = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("nome"));
        return PageResponse.of(usuarios.findAll(pagina), UsuarioResponse::from);
    }

    @Transactional
    public UsuarioResponse criar(CriarUsuarioRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
            throw new RegraNegocioException(EMAIL_EM_USO);
        }
        Usuario usuario = usuarios.save(Usuario.builder()
            .nome(request.nome().trim())
            .email(email)
            .hashSenha(passwordEncoder.encode(request.password()))
            .papel(request.papel())
            .build());
        return UsuarioResponse.from(usuario);
    }

    /**
     * O ADMIN não altera o próprio papel nem se desativa: assim sempre resta ao menos
     * um ADMIN ativo (quem fez a operação) e ninguém se tranca para fora do sistema.
     */
    @Transactional
    public UsuarioResponse alterarPapel(Long usuarioId, Papel papel, Long adminId) {
        Usuario usuario = buscarOutroUsuario(usuarioId, adminId, "alterar o próprio papel");
        usuario.setPapel(papel);
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public UsuarioResponse alterarAtivo(Long usuarioId, boolean ativo, Long adminId) {
        Usuario usuario = buscarOutroUsuario(usuarioId, adminId, "desativar a própria conta");
        usuario.setAtivo(ativo);
        return UsuarioResponse.from(usuario);
    }

    @Transactional
    public UsuarioResponse atualizarDados(Long usuarioId, AtualizarUsuarioRequest request) {
        Usuario usuario = buscar(usuarioId);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        usuarios.findByEmailIgnoreCase(email)
            .filter(outro -> !outro.getId().equals(usuarioId))
            .ifPresent(outro -> {
                throw new RegraNegocioException(EMAIL_EM_USO);
            });
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        return UsuarioResponse.from(usuario);
    }

    /** Redefinição pelo ADMIN (usuário esqueceu a senha); não pede a senha antiga. */
    @Transactional
    public void redefinirSenha(Long usuarioId, String novaSenha) {
        buscar(usuarioId).setHashSenha(passwordEncoder.encode(novaSenha));
    }

    /** Troca feita pelo próprio usuário logado, confirmando a senha atual. */
    @Transactional
    public void alterarPropriaSenha(Long usuarioId, AlterarSenhaRequest request) {
        Usuario usuario = buscar(usuarioId);
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getHashSenha())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        usuario.setHashSenha(passwordEncoder.encode(request.novaSenha()));
    }

    private Usuario buscar(Long usuarioId) {
        return usuarios.findById(usuarioId).orElseThrow(() -> new UsuarioNotFoundException(usuarioId));
    }

    private Usuario buscarOutroUsuario(Long usuarioId, Long adminId, String acaoProibida) {
        if (usuarioId.equals(adminId)) {
            throw new RegraNegocioException("Você não pode " + acaoProibida + ".");
        }
        return buscar(usuarioId);
    }
}
