package com.ykscoach.api.doc;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<DocumentItem, Long> {
    List<DocumentItem> findByOwnerUsernameOrderByIdDesc(String ownerUsername);
}


