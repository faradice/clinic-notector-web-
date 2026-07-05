package com.raggi.clinicnotector.controller;

import com.raggi.clinicnotector.domain.model.Chord;
import com.raggi.clinicnotector.domain.model.Workspace;
import com.raggi.clinicnotector.domain.model.WorkspaceCard;
import com.raggi.clinicnotector.domain.repository.ChordRepository;
import com.raggi.clinicnotector.domain.repository.WorkspaceRepository;
import com.raggi.clinicnotector.dto.WorkspaceDTO;
import com.raggi.clinicnotector.mapper.WorkspaceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final ChordRepository chordRepository;
    private final WorkspaceMapper workspaceMapper;

    @GetMapping
    public ResponseEntity<List<WorkspaceDTO>> getAllWorkspaces() {
        List<WorkspaceDTO> workspaces = workspaceRepository.findAll().stream()
                .map(workspaceMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workspaces);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDTO> getWorkspaceById(@PathVariable Long id) {
        return workspaceRepository.findById(id)
                .map(workspaceMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<WorkspaceDTO> createWorkspace(@RequestBody WorkspaceDTO workspaceDTO) {
        Workspace workspace = workspaceMapper.toEntity(workspaceDTO);
        Workspace savedWorkspace = workspaceRepository.save(workspace);
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceMapper.toDTO(savedWorkspace));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceDTO> updateWorkspace(@PathVariable Long id, @RequestBody WorkspaceDTO workspaceDTO) {
        return workspaceRepository.findById(id)
                .map(existingWorkspace -> {
                    existingWorkspace.setName(workspaceDTO.getName());
                    existingWorkspace.setDescription(workspaceDTO.getDescription());
                    Workspace savedWorkspace = workspaceRepository.save(existingWorkspace);
                    return ResponseEntity.ok(workspaceMapper.toDTO(savedWorkspace));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id) {
        if (!workspaceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        workspaceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add a chord card to workspace at specified position
     */
    @PostMapping("/{id}/cards")
    public ResponseEntity<WorkspaceDTO> addCard(
            @PathVariable Long id,
            @RequestBody AddCardRequest request) {

        return workspaceRepository.findById(id)
                .map(workspace -> {
                    Chord chord = chordRepository.findById(request.getChordId())
                            .orElseThrow(() -> new RuntimeException("Chord not found"));

                    WorkspaceCard card = WorkspaceCard.builder()
                            .workspace(workspace)
                            .chord(chord)
                            .positionX(request.getPositionX())
                            .positionY(request.getPositionY())
                            .build();

                    workspace.getCards().add(card);
                    Workspace savedWorkspace = workspaceRepository.save(workspace);
                    return ResponseEntity.ok(workspaceMapper.toDTO(savedWorkspace));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update card position (for drag-drop)
     */
    @PutMapping("/{workspaceId}/cards/{cardId}/position")
    public ResponseEntity<WorkspaceDTO> updateCardPosition(
            @PathVariable Long workspaceId,
            @PathVariable Long cardId,
            @RequestBody UpdatePositionRequest request) {

        return workspaceRepository.findById(workspaceId)
                .map(workspace -> {
                    workspace.getCards().stream()
                            .filter(card -> card.getId().equals(cardId))
                            .findFirst()
                            .ifPresent(card -> {
                                card.setPositionX(request.getPositionX());
                                card.setPositionY(request.getPositionY());
                            });

                    Workspace savedWorkspace = workspaceRepository.save(workspace);
                    return ResponseEntity.ok(workspaceMapper.toDTO(savedWorkspace));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Remove a card from workspace
     */
    @DeleteMapping("/{workspaceId}/cards/{cardId}")
    public ResponseEntity<WorkspaceDTO> removeCard(
            @PathVariable Long workspaceId,
            @PathVariable Long cardId) {

        return workspaceRepository.findById(workspaceId)
                .map(workspace -> {
                    workspace.getCards().removeIf(card -> card.getId().equals(cardId));
                    Workspace savedWorkspace = workspaceRepository.save(workspace);
                    return ResponseEntity.ok(workspaceMapper.toDTO(savedWorkspace));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Batch update card positions (for multi-card moves)
     */
    @PutMapping("/{workspaceId}/cards/positions")
    public ResponseEntity<WorkspaceDTO> updateCardPositions(
            @PathVariable Long workspaceId,
            @RequestBody List<CardPositionUpdate> updates) {

        return workspaceRepository.findById(workspaceId)
                .map(workspace -> {
                    updates.forEach(update -> {
                        workspace.getCards().stream()
                                .filter(card -> card.getId().equals(update.getCardId()))
                                .findFirst()
                                .ifPresent(card -> {
                                    card.setPositionX(update.getPositionX());
                                    card.setPositionY(update.getPositionY());
                                });
                    });

                    Workspace savedWorkspace = workspaceRepository.save(workspace);
                    return ResponseEntity.ok(workspaceMapper.toDTO(savedWorkspace));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Request/Response DTOs
    public static class AddCardRequest {
        private Long chordId;
        private Integer positionX;
        private Integer positionY;

        public Long getChordId() { return chordId; }
        public void setChordId(Long chordId) { this.chordId = chordId; }
        public Integer getPositionX() { return positionX; }
        public void setPositionX(Integer positionX) { this.positionX = positionX; }
        public Integer getPositionY() { return positionY; }
        public void setPositionY(Integer positionY) { this.positionY = positionY; }
    }

    public static class UpdatePositionRequest {
        private Integer positionX;
        private Integer positionY;

        public Integer getPositionX() { return positionX; }
        public void setPositionX(Integer positionX) { this.positionX = positionX; }
        public Integer getPositionY() { return positionY; }
        public void setPositionY(Integer positionY) { this.positionY = positionY; }
    }

    public static class CardPositionUpdate {
        private Long cardId;
        private Integer positionX;
        private Integer positionY;

        public Long getCardId() { return cardId; }
        public void setCardId(Long cardId) { this.cardId = cardId; }
        public Integer getPositionX() { return positionX; }
        public void setPositionX(Integer positionX) { this.positionX = positionX; }
        public Integer getPositionY() { return positionY; }
        public void setPositionY(Integer positionY) { this.positionY = positionY; }
    }
}
