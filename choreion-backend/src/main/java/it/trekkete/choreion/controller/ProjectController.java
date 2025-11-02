package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.CreateProjectRequest;
import it.trekkete.choreion.data.dto.ProjectDTO;
import it.trekkete.choreion.data.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getUserProjects(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(projectService.getUserProjects(username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> getProjectById(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(projectService.getProjectById(id, username));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(projectService.createProject(request, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(projectService.updateProject(id, request, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        projectService.deleteProject(id, username);
        return ResponseEntity.noContent().build();
    }
}
