package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.ChoreographyDTO;
import it.trekkete.choreion.data.dto.ChoreographySummaryDTO;
import it.trekkete.choreion.data.service.ChoreographyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/choreographies")
@CrossOrigin(origins = "*")
public class ChoreographyController {

    @Autowired
    private ChoreographyService choreographyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<List<ChoreographySummaryDTO>> getAllChoreographies(
            @RequestParam Long projectId) {
        return ResponseEntity.ok(choreographyService.getAllChoreographies(projectId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ChoreographyDTO> getChoreographyById(
            @PathVariable Long id,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(choreographyService.getChoreographyById(id, projectId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ChoreographyDTO> createChoreography(
            @RequestBody ChoreographyDTO choreographyDTO,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(choreographyService.createChoreography(choreographyDTO, projectId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ChoreographyDTO> updateChoreography(
            @PathVariable Long id,
            @RequestBody ChoreographyDTO choreographyDTO,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(choreographyService.updateChoreography(id, choreographyDTO, projectId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<Void> deleteChoreography(
            @PathVariable Long id,
            @RequestParam Long projectId) {
        choreographyService.deleteChoreography(id, projectId);
        return ResponseEntity.noContent().build();
    }
}