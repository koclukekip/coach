package com.ykscoach.api.coach;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/coaches")
public class CoachController {

    private final CoachRepository coachRepository;

    public CoachController(CoachRepository coachRepository) {
        this.coachRepository = coachRepository;
    }

    @GetMapping
    public List<Coach> list() { return coachRepository.findAll(); }

    @PostMapping
    public ResponseEntity<Coach> create(@RequestBody Coach coach) {
        Coach saved = coachRepository.save(coach);
        return ResponseEntity.created(URI.create("/api/coaches/" + saved.getId())).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coach> get(@PathVariable Long id) {
        return coachRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!coachRepository.existsById(id)) return ResponseEntity.notFound().build();
        coachRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}


