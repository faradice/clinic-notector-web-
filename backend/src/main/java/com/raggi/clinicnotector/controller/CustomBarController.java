package com.raggi.clinicnotector.controller;

import com.raggi.clinicnotector.domain.model.CustomBar;
import com.raggi.clinicnotector.domain.repository.CustomBarRepository;
import com.raggi.clinicnotector.dto.CustomBarDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/custom-bars")
@RequiredArgsConstructor
public class CustomBarController {

    private final CustomBarRepository customBarRepository;

    @GetMapping
    public ResponseEntity<List<CustomBarDTO>> getAll() {
        List<CustomBarDTO> bars = customBarRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bars);
    }

    @PostMapping
    public ResponseEntity<CustomBarDTO> create(@RequestBody CustomBarDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()
                || dto.getNotes() == null || dto.getNotes().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        CustomBar saved = customBarRepository.save(toEntity(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!customBarRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        customBarRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private CustomBarDTO toDTO(CustomBar bar) {
        return CustomBarDTO.builder()
                .id(bar.getId())
                .name(bar.getName())
                .notes(Arrays.stream(bar.getNotes().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList()))
                .createdAt(bar.getCreatedAt())
                .build();
    }

    private CustomBar toEntity(CustomBarDTO dto) {
        return CustomBar.builder()
                .name(dto.getName().trim())
                .notes(dto.getNotes().stream()
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(",")))
                .build();
    }
}
