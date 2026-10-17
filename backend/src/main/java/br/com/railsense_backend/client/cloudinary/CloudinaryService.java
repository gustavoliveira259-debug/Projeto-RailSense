package br.com.railsense_backend.client.cloudinary;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import br.com.railsense_backend.exception.CloudinaryUploadException;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public CloudinaryUploadResult upload(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "railsense/imagens",
                "resource_type", "image"
            ));
            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            return new CloudinaryUploadResult(url, publicId);
        } catch (IOException e) {
            throw new CloudinaryUploadException("Falha ao enviar imagem para o Cloudinary", e);
        }
    }

    /** Remoção best-effort: falhas são só registradas, para não mascarar o erro original. */
    public void delete(String publicId) {
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                "resource_type", "image",
                "invalidate", true
            ));
            log.info("Imagem órfã removida do Cloudinary: {} ({})", publicId, result.get("result"));
        } catch (Exception e) {
            log.error("Não foi possível remover a imagem órfã {} do Cloudinary", publicId, e);
        }
    }
}