package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.dto.AuthResponse;
import it.trekkete.choreion.data.dto.LoginRequest;
import it.trekkete.choreion.data.dto.RegisterRequest;
import it.trekkete.choreion.data.entity.Role;
import it.trekkete.choreion.data.entity.User;
import it.trekkete.choreion.data.repository.RoleRepository;
import it.trekkete.choreion.data.repository.UserRepository;
import it.trekkete.choreion.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(java.util.stream.Collectors.toList());

        return new AuthResponse(jwt, user.getId(), user.getUsername(), user.getFullName(), roles);
    }


    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setFullName(registerRequest.getFullName());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        Role userRole = roleRepository.findByName(Role.RoleType.ROLE_USER)
                                      .orElseThrow(() -> new RuntimeException("User Role not set"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getUsername(),
                        registerRequest.getPassword()
                )
        );

        String jwt = tokenProvider.generateToken(authentication);

        java.util.List<String> rolesList = savedUser.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(java.util.stream.Collectors.toList());

        return new AuthResponse(jwt, savedUser.getId(), savedUser.getUsername(), savedUser.getFullName(), rolesList);
    }
}