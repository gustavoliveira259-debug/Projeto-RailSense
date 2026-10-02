package br.com.railsense_backend.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ImageBytesFetcher {

    private final RestClient restClient = RestClient.create();

    public byte[] fetch(String url) {
        return restClient.get().uri(url).retrieve().body(byte[].class);
    }
}