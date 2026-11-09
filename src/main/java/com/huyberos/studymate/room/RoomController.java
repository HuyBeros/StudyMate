package com.huyberos.studymate.room;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/study-rooms")
@RequiredArgsConstructor
class RoomController {
    private final RoomService rooms;
    private final RoomSocketHub sockets;
    private final JwtUtil jwt;

    record Create(String name) {}
    record Timer(RoomTimer.Action action, Long revision) {}

    @GetMapping
    ApiResponse<List<RoomService.RoomLink>> list() { return ApiResponse.ok(rooms.list()); }

    @PostMapping
    ApiResponse<UUID> create(@RequestBody Create request) { return ApiResponse.ok(rooms.create(request.name())); }

    @GetMapping("/{room}/preview")
    ApiResponse<RoomService.Preview> preview(@PathVariable UUID room) { return ApiResponse.ok(rooms.preview(room)); }

    @PostMapping("/{room}/join")
    ApiResponse<RoomService.Snapshot> join(@PathVariable UUID room) {
        rooms.join(room);
        sockets.changed(room);
        return ApiResponse.ok(rooms.snapshot(room));
    }

    @GetMapping("/{room}")
    ApiResponse<RoomService.Snapshot> snapshot(@PathVariable UUID room) { return ApiResponse.ok(rooms.snapshot(room)); }

    @PostMapping("/{room}/socket-ticket")
    ResponseEntity<ApiResponse<String>> ticket(@PathVariable UUID room, @RequestHeader(HttpHeaders.AUTHORIZATION) String auth) {
        long user = rooms.authorizeSocket(room);
        var expiry = jwt.parseToken(auth.substring(7)).getExpiration().toInstant();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.ok(sockets.issue(room, user, expiry)));
    }

    @PostMapping("/{room}/timer")
    ApiResponse<RoomService.Snapshot> timer(@PathVariable UUID room, @RequestBody Timer request) {
        rooms.timer(room, request.action(), request.revision());
        sockets.changed(room);
        return ApiResponse.ok(rooms.snapshot(room));
    }

    @PostMapping(value = "/{room}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<Void> send(@PathVariable UUID room, @RequestParam UUID clientId,
                           @RequestParam(required = false) String text, @RequestParam(required = false) MultipartFile file) {
        rooms.send(room, clientId, text, file);
        sockets.changed(room);
        return ApiResponse.ok("Đã gửi.", null);
    }

    @GetMapping("/{room}/images/{message}")
    ResponseEntity<byte[]> image(@PathVariable UUID room, @PathVariable long message) {
        var image = rooms.image(room, message);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.type()))
                .cacheControl(CacheControl.noStore()).header("X-Content-Type-Options", "nosniff").body(image.bytes());
    }

    @PostMapping("/{room}/leave")
    ApiResponse<Void> leave(@PathVariable UUID room) {
        sockets.disconnect(room, rooms.leave(room));
        sockets.changed(room);
        return ApiResponse.ok("Đã rời phòng.", null);
    }

    @DeleteMapping("/{room}")
    ApiResponse<Void> close(@PathVariable UUID room) {
        rooms.close(room);
        sockets.disconnect(room, null);
        return ApiResponse.ok("Đã đóng phòng.", null);
    }
}
