package br.com.railsense_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.railsense_backend.dto.response.ImageUploadResponse;
import br.com.railsense_backend.service.ImageService;

@RestController
@RequestMapping("/api/imagens")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ImageUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("eixoId") Long eixoId) {
        ImageUploadResponse response = imageService.uploadImagem(file, eixoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/baseline")
    public ResponseEntity<Void> marcarComoBaseline(@PathVariable Long id) {
        imageService.marcarComoBaseline(id);
        return ResponseEntity.noContent().build();
    }
}