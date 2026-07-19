package com.raggi.clinicnotector.mapper;

import com.raggi.clinicnotector.domain.model.Workspace;
import com.raggi.clinicnotector.domain.model.WorkspaceCard;
import com.raggi.clinicnotector.dto.WorkspaceCardDTO;
import com.raggi.clinicnotector.dto.WorkspaceDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class WorkspaceMapper {

    public WorkspaceDTO toDTO(Workspace workspace) {
        if (workspace == null) {
            return null;
        }

        return WorkspaceDTO.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .cards(workspace.getCards().stream()
                        .map(this::toCardDTO)
                        .collect(Collectors.toList()))
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }

    public Workspace toEntity(WorkspaceDTO dto) {
        if (dto == null) {
            return null;
        }

        return Workspace.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
    }

    private WorkspaceCardDTO toCardDTO(WorkspaceCard card) {
        return WorkspaceCardDTO.builder()
                .id(card.getId())
                .chordId(card.getChord().getId())
                .chordName(card.getChord().getName())
                .positionX(card.getPositionX())
                .positionY(card.getPositionY())
                .beats(card.getBeats() != null ? card.getBeats() : 1)
                .build();
    }
}
