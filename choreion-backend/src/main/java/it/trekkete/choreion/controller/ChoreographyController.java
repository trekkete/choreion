package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.ChoreographyDTO;
import it.trekkete.choreion.data.dto.ChoreographySummaryDTO;
import it.trekkete.choreion.data.service.ChoreographyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/choreographies")
@CrossOrigin(origins = "*")
public class ChoreographyController {

    @Autowired
    private ChoreographyService choreographyService;

    @GetMapping
    public ResponseEntity<List<ChoreographySummaryDTO>> getAllChoreographies() {
        return ResponseEntity.ok(choreographyService.getAllChoreographies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChoreographyDTO> getChoreographyById(@PathVariable Long id) {
        return ResponseEntity.ok(choreographyService.getChoreographyById(id));
    }

    @PostMapping
    public ResponseEntity<ChoreographyDTO> createChoreography(
            @RequestBody ChoreographyDTO choreographyDTO) {
        return ResponseEntity.ok(choreographyService.createChoreography(choreographyDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChoreographyDTO> updateChoreography(
            @PathVariable Long id,
            @RequestBody ChoreographyDTO choreographyDTO) {
        return ResponseEntity.ok(choreographyService.updateChoreography(id, choreographyDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChoreography(@PathVariable Long id) {
        choreographyService.deleteChoreography(id);
        return ResponseEntity.noContent().build();
    }
}