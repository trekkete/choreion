package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.PersonMappingDTO;
import it.trekkete.choreion.data.service.UserPersonMappingService;
import it.trekkete.choreion.data.service.UserService;
import it.trekkete.choreion.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserPersonMappingService mappingService;

    @Autowired
    private UserService userService;

    @GetMapping("/me/mappings")
    @PreAuthorize("hasAnyRole('USER', 'CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<List<PersonMappingDTO>> getMyMappings(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PersonMappingDTO> mappings = mappingService.getUserMappings(currentUser.getId());
        return ResponseEntity.ok(mappings);
    }

    @PostMapping("/me/mappings")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<PersonMappingDTO> createMapping(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, Object> request) {

        Long personId = Long.valueOf(request.get("personId").toString());
        Long choreographyId = request.get("choreographyId") != null
                              ? Long.valueOf(request.get("choreographyId").toString())
                              : null;
        Boolean isPrimary = request.get("isPrimary") != null
                            ? Boolean.valueOf(request.get("isPrimary").toString())
                            : false;

        PersonMappingDTO mapping = mappingService.createMapping(
                currentUser.getId(),
                personId,
                choreographyId,
                isPrimary
        );
        return ResponseEntity.ok(mapping);
    }

    @DeleteMapping("/me/mappings/{mappingId}")
    @PreAuthorize("hasAnyRole('CHOREOGRAPHER', 'ADMIN')")
    public ResponseEntity<Void> deleteMapping(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long mappingId) {
        mappingService.deleteMapping(mappingId);
        return ResponseEntity.noContent().build();
    }

    // Admin endpoints
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String fullName = request.get("fullName");
        String password = request.get("password");
        String role = request.get("role");
        return ResponseEntity.ok(userService.createUser(username, email, fullName, password, role));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String role = request.get("role");
        userService.updateUserRole(id, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/mappings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PersonMappingDTO> createMappingForUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        Long personId = Long.valueOf(request.get("personId").toString());
        Long choreographyId = request.get("choreographyId") != null
                              ? Long.valueOf(request.get("choreographyId").toString())
                              : null;
        Boolean isPrimary = request.get("isPrimary") != null
                            ? Boolean.valueOf(request.get("isPrimary").toString())
                            : false;
        PersonMappingDTO mapping = mappingService.createMapping(userId, personId, choreographyId, isPrimary);
        return ResponseEntity.ok(mapping);
    }

    @GetMapping("/{userId}/mappings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PersonMappingDTO>> getUserMappings(@PathVariable Long userId) {
        return ResponseEntity.ok(mappingService.getUserMappings(userId));
    }

    @GetMapping("/mappings/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PersonMappingDTO>> getAllMappings() {
        return ResponseEntity.ok(mappingService.getAllMappings());
    }

    @DeleteMapping("/mappings/{mappingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMappingAdmin(@PathVariable Long mappingId) {
        mappingService.deleteMapping(mappingId);
        return ResponseEntity.noContent().build();
    }
}