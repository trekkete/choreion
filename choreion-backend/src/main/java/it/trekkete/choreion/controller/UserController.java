package it.trekkete.choreion.controller;

import it.trekkete.choreion.data.dto.PersonMappingDTO;
import it.trekkete.choreion.data.service.UserPersonMappingService;
import it.trekkete.choreion.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/me/mappings")
    public ResponseEntity<List<PersonMappingDTO>> getMyMappings(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PersonMappingDTO> mappings = mappingService.getUserMappings(currentUser.getId());
        return ResponseEntity.ok(mappings);
    }

    @PostMapping("/me/mappings")
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
    public ResponseEntity<Void> deleteMapping(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long mappingId) {
        mappingService.deleteMapping(mappingId);
        return ResponseEntity.noContent().build();
    }
}