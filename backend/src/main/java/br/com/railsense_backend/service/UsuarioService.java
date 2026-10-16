package br.com.railsense_backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.request.CriarUsuarioRequest;
import br.com.railsense_backend.dto.response.UsuarioResponse;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.exception.UsuarioNotFoundException;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarios.findAll(Sort.by("nome")).stream().map(UsuarioResponse::from).toList();
    }

    @Transactional
    public UsuarioResponse criar(CriarUsuarioRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
            throw new RegraNegocioException("Já existe um usuário com esse e-mail.");
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

    private Usuario buscarOutroUsuario(Long usuarioId, Long adminId, String acaoProibida) {
        if (usuarioId.equals(adminId)) {
            throw new RegraNegocioException("Você não pode " + acaoProibida + ".");
        }
        return usuarios.findById(usuarioId).orElseThrow(() -> new UsuarioNotFoundException(usuarioId));
    }
}
