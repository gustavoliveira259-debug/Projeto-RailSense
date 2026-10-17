package br.com.railsense_backend.dto.response;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * Formato estável de página para a API. Evita serializar o Page do Spring diretamente,
 * cujo JSON expõe detalhes internos e muda entre versões.
 */
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
            page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
