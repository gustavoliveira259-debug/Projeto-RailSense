package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import br.com.railsense_backend.dto.request.AlterarSenhaRequest;
import br.com.railsense_backend.dto.request.AtualizarUsuarioRequest;
import br.com.railsense_backend.dto.request.CriarUsuarioRequest;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.exception.UsuarioNotFoundException;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock UsuarioRepository usuarios;
    @Mock PasswordEncoder passwordEncoder;

    UsuarioService service;

    @BeforeEach
    void setUp() {
        service = new UsuarioService(usuarios, passwordEncoder);
    }

    @Test
    void criaUsuarioComPapelEscolhidoEmailNormalizadoESenhaComHash() {
        when(usuarios.findByEmailIgnoreCase("ana@ferrovia.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha-bem-longa")).thenReturn("HASH");
        when(usuarios.save(any())).thenAnswer(i -> i.getArgument(0));

        var resposta = service.criar(
            new CriarUsuarioRequest(" Ana ", " Ana@Ferrovia.com ", "senha-bem-longa", Papel.ADMIN));

        assertThat(resposta.nome()).isEqualTo("Ana");
        assertThat(resposta.email()).isEqualTo("ana@ferrovia.com");
        assertThat(resposta.papel()).isEqualTo(Papel.ADMIN);
        assertThat(resposta.ativo()).isTrue();
    }

    @Test
    void naoCriaUsuarioComEmailRepetido() {
        when(usuarios.findByEmailIgnoreCase("ana@ferrovia.com")).thenReturn(Optional.of(Usuario.builder().build()));

        assertThatThrownBy(() -> service.criar(
            new CriarUsuarioRequest("Ana", "ana@ferrovia.com", "senha-bem-longa", Papel.ENGENHEIRO)))
            .isInstanceOf(RegraNegocioException.class);
        verify(usuarios, never()).save(any());
    }

    @Test
    void alteraPapelDeOutroUsuario() {
        Usuario alvo = Usuario.builder().papel(Papel.ENGENHEIRO).build();
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));

        service.alterarPapel(2L, Papel.ADMIN, 1L);

        assertThat(alvo.getPapel()).isEqualTo(Papel.ADMIN);
    }

    @Test
    void adminNaoAlteraOProprioPapel() {
        assertThatThrownBy(() -> service.alterarPapel(1L, Papel.ENGENHEIRO, 1L))
            .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void adminNaoDesativaAPropriaConta() {
        assertThatThrownBy(() -> service.alterarAtivo(1L, false, 1L))
            .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void desativaOutroUsuario() {
        Usuario alvo = Usuario.builder().build();
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));

        service.alterarAtivo(2L, false, 1L);

        assertThat(alvo.isAtivo()).isFalse();
    }

    @Test
    void usuarioInexistenteDa404() {
        when(usuarios.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.alterarAtivo(9L, false, 1L)).isInstanceOf(UsuarioNotFoundException.class);
    }

    @Test
    void atualizaNomeEEmailNormalizado() {
        Usuario alvo = usuarioComId(2L);
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));
        when(usuarios.findByEmailIgnoreCase("bia@ferrovia.com")).thenReturn(Optional.empty());

        var resposta = service.atualizarDados(2L, new AtualizarUsuarioRequest(" Bia ", " Bia@Ferrovia.com "));

        assertThat(resposta.nome()).isEqualTo("Bia");
        assertThat(alvo.getEmail()).isEqualTo("bia@ferrovia.com");
    }

    @Test
    void naoAtualizaParaEmailDeOutroUsuario() {
        when(usuarios.findById(2L)).thenReturn(Optional.of(usuarioComId(2L)));
        when(usuarios.findByEmailIgnoreCase("ana@ferrovia.com")).thenReturn(Optional.of(usuarioComId(3L)));

        assertThatThrownBy(() -> service.atualizarDados(2L, new AtualizarUsuarioRequest("Ana", "ana@ferrovia.com")))
            .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void mantemOProprioEmailAoAtualizar() {
        Usuario alvo = usuarioComId(2L);
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));
        when(usuarios.findByEmailIgnoreCase("ana@ferrovia.com")).thenReturn(Optional.of(alvo));

        service.atualizarDados(2L, new AtualizarUsuarioRequest("Ana Souza", "ana@ferrovia.com"));

        assertThat(alvo.getNome()).isEqualTo("Ana Souza");
    }

    @Test
    void adminRedefineSenhaComHash() {
        Usuario alvo = usuarioComId(2L);
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));
        when(passwordEncoder.encode("nova-senha-longa")).thenReturn("HASH_NOVO");

        service.redefinirSenha(2L, "nova-senha-longa");

        assertThat(alvo.getHashSenha()).isEqualTo("HASH_NOVO");
    }

    @Test
    void usuarioTrocaAPropriaSenhaComASenhaAtualCorreta() {
        Usuario eu = usuarioComId(2L);
        eu.setHashSenha("HASH_ANTIGO");
        when(usuarios.findById(2L)).thenReturn(Optional.of(eu));
        when(passwordEncoder.matches("senha-atual", "HASH_ANTIGO")).thenReturn(true);
        when(passwordEncoder.encode("nova-senha-longa")).thenReturn("HASH_NOVO");

        service.alterarPropriaSenha(2L, new AlterarSenhaRequest("senha-atual", "nova-senha-longa"));

        assertThat(eu.getHashSenha()).isEqualTo("HASH_NOVO");
    }

    @Test
    void naoTrocaSenhaSeASenhaAtualEstiverErrada() {
        Usuario eu = usuarioComId(2L);
        eu.setHashSenha("HASH_ANTIGO");
        when(usuarios.findById(2L)).thenReturn(Optional.of(eu));
        when(passwordEncoder.matches("errada", "HASH_ANTIGO")).thenReturn(false);

        assertThatThrownBy(() -> service.alterarPropriaSenha(2L, new AlterarSenhaRequest("errada", "nova-senha-longa")))
            .isInstanceOf(RegraNegocioException.class);
        assertThat(eu.getHashSenha()).isEqualTo("HASH_ANTIGO");
    }

    private static Usuario usuarioComId(Long id) {
        Usuario usuario = Usuario.builder().nome("Ana").email("ana@ferrovia.com").build();
        usuario.setId(id);
        return usuario;
    }
}
