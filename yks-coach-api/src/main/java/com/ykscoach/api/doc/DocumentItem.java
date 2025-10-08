package com.ykscoach.api.doc;

import jakarta.persistence.*;

@Entity
@Table(name = "coach_documents")
public class DocumentItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerUsername; // coach username

    @Column(nullable = false)
    private String filename;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] content;

    public Long getId() { return id; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public byte[] getContent() { return content; }
    public void setContent(byte[] content) { this.content = content; }
}


