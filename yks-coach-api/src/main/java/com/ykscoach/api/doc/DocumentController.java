package com.ykscoach.api.doc;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

record DocDto(Long id, String filename) {}

@RestController
@RequestMapping("/api/docs")
@CrossOrigin
public class DocumentController {
    private final DocumentRepository docs;

    public DocumentController(DocumentRepository docs) {
        this.docs = docs;
    }

    @GetMapping
    public java.util.List<DocDto> list(Principal principal) {
        String owner = principal != null ? principal.getName() : "";
        return docs.findByOwnerUsernameOrderByIdDesc(owner).stream().map(d -> new DocDto(d.getId(), d.getFilename())).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(Principal principal, @RequestPart("file") MultipartFile file) throws IOException {
        String owner = principal != null ? principal.getName() : null;
        if (owner == null || owner.isBlank()) return ResponseEntity.status(401).build();
        DocumentItem d = new DocumentItem();
        d.setOwnerUsername(owner);
        d.setFilename(file.getOriginalFilename());
        d.setContent(file.getBytes());
        docs.save(d);
        return ResponseEntity.ok(new DocDto(d.getId(), d.getFilename()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(Principal principal, @PathVariable Long id) {
        var opt = docs.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var d = opt.get();
        if (principal == null || !principal.getName().equals(d.getOwnerUsername())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + d.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(d.getContent());
    }
}


