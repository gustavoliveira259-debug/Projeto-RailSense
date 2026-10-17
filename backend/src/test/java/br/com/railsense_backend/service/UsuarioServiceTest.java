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

import br.com.railsense_backend.dto.request.CriarUsuarioRequest;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.exception.RequisicaoInvalidaException;
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
            new CriarUsuarioRequest(" Ana ", " Ana@Ferrovia.com ", "senha-bem-longa", Papel.GERENTE));

        assertThat(resposta.nome()).isEqualTo("Ana");
        assertThat(resposta.email()).isEqualTo("ana@ferrovia.com");
        assertThat(resposta.papel()).isEqualTo(Papel.GERENTE);
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

        service.alterarPapel(2L, Papel.GERENTE, 1L);

        assertThat(alvo.getPapel()).isEqualTo(Papel.GERENTE);
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
    void adminRedefineSenhaDeOutroUsuario() {
        Usuario alvo = Usuario.builder().hashSenha("ANTIGO").build();
        when(usuarios.findById(2L)).thenReturn(Optional.of(alvo));
        when(passwordEncoder.encode("nova-senha-longa")).thenReturn("NOVO");

        service.redefinirSenha(2L, "nova-senha-longa", 1L);

        assertThat(alvo.getHashSenha()).isEqualTo("NOVO");
    }

    @Test
    void adminNaoRedefineAPropriaSenhaPorAqui() {
        assertThatThrownBy(() -> service.redefinirSenha(1L, "nova-senha-longa", 1L))
            .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void trocaPropriaSenhaExigeSenhaAtualCorreta() {
        Usuario eu = Usuario.builder().hashSenha("HASH").build();
        when(usuarios.findById(3L)).thenReturn(Optional.of(eu));
        when(passwordEncoder.matches("errada", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> service.alterarPropriaSenha(3L, "errada", "nova-senha-longa"))
            .isInstanceOf(RequisicaoInvalidaException.class);
        verify(passwordEncoder, never()).encode(any());
        assertThat(eu.getHashSenha()).isEqualTo("HASH");
    }

    @Test
    void trocaPropriaSenha() {
        Usuario eu = Usuario.builder().hashSenha("HASH").build();
        when(usuarios.findById(3L)).thenReturn(Optional.of(eu));
        when(passwordEncoder.matches("senha-atual-longa", "HASH")).thenReturn(true);
        when(passwordEncoder.encode("nova-senha-longa")).thenReturn("NOVO");

        service.alterarPropriaSenha(3L, "senha-atual-longa", "nova-senha-longa");

        assertThat(eu.getHashSenha()).isEqualTo("NOVO");
    }

    @Test
    void usuarioInexistenteDa404() {
        when(usuarios.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.alterarAtivo(9L, false, 1L)).isInstanceOf(UsuarioNotFoundException.class);
    }
}
