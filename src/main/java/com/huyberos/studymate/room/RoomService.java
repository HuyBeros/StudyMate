package com.huyberos.studymate.room;

import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {
    private static final int CAPACITY = 6;
    private static final int IMAGE_LIMIT = 2 * 1024 * 1024;

    private final RoomRepository rooms;
    private final SecurityUtil security;
    private final Clock clock;

    public record RoomLink(UUID id, String name, boolean host) {}
    public record Preview(String name, RoomTimer.Phase phase, long remainingMs, int members, int capacity) {}
    public record Snapshot(UUID id, String name, boolean host, RoomTimer.Phase phase, boolean paused,
                           Instant deadline, long remainingMs, Instant serverNow, long revision, Instant expiresAt,
                           List<RoomRepository.Member> members, List<RoomRepository.Message> messages) {}

    public List<RoomLink> list() { return rooms.joinedRooms(currentUser()); }

    @Transactional
    public UUID create(String name) {
        if (name == null || name.isBlank() || name.strip().length() > 80)
            throw new BadRequestException("Tên phòng cần từ 1 đến 80 ký tự.");
        rooms.purgeExpired();
        long user = currentUser();
        rooms.lockOwner(user);
        if (rooms.ownedCount(user) >= 3) throw new ConflictException("Bạn đã có 3 phòng. Hãy đóng một phòng trước.");
        UUID id = UUID.randomUUID();
        rooms.create(id, user, name.strip(), clock.instant().plus(Duration.ofDays(7)));
        rooms.add(id, user);
        return id;
    }

    @Transactional(readOnly = true)
    public Preview preview(UUID id) {
        var room = requireRoom(id, false);
        var now = clock.instant();
        var timer = room.timer().at(now);
        return new Preview(room.name(), timer.phase(), timer.left(now), rooms.members(id).size(), CAPACITY);
    }

    @Transactional
    public void join(UUID id) {
        requireRoom(id, true);
        long user = currentUser();
        if (rooms.member(id, user)) return;
        if (rooms.members(id).size() >= CAPACITY) throw new ConflictException("Phòng đã đủ 6 thành viên.");
        rooms.add(id, user);
    }

    @Transactional(readOnly = true)
    public Snapshot snapshot(UUID id) {
        long user = currentUser();
        var room = requireMember(id, user, false);
        var now = clock.instant();
        var timer = room.timer().at(now);
        return new Snapshot(id, room.name(), room.ownerId() == user, timer.phase(),
                timer.phase() != RoomTimer.Phase.WAITING && timer.deadline() == null,
                timer.deadline(), timer.left(now), now, room.revision(), room.expiresAt(),
                rooms.members(id), rooms.messages(id));
    }

    @Transactional
    public void timer(UUID id, RoomTimer.Action action, Long revision) {
        long user = currentUser();
        var room = requireMember(id, user, true);
        if (room.ownerId() != user) throw new ResourceNotFoundException("Chỉ chủ phòng được điều khiển đồng hồ.");
        if (action == null || revision == null) throw new BadRequestException("Thiếu thao tác hoặc trạng thái đồng hồ.");
        if (room.revision() != revision) throw new ConflictException("Đồng hồ vừa thay đổi. Hãy thử lại.");
        var now = clock.instant();
        rooms.updateTimer(id, room.timer().at(now).command(action, now));
    }

    @Transactional
    public long leave(UUID id) {
        long user = currentUser();
        var room = requireMember(id, user, true);
        if (room.ownerId() == user) throw new ConflictException("Chủ phòng có thể đóng phòng.");
        rooms.remove(id, user);
        return user;
    }

    @Transactional
    public void close(UUID id) {
        long user = currentUser();
        var room = requireMember(id, user, true);
        if (room.ownerId() != user) throw new ResourceNotFoundException("Chỉ chủ phòng được đóng phòng.");
        rooms.close(id);
    }

    @Transactional
    public void send(UUID id, UUID clientId, String text, MultipartFile file) {
        long user = currentUser();
        requireMember(id, user, true);
        if (clientId == null) throw new BadRequestException("Thiếu mã tin nhắn.");
        if (rooms.alreadySent(id, user, clientId)) return;
        var body = text == null ? "" : text.strip();
        if (body.length() > 1000 || (body.isEmpty() && file == null))
            throw new BadRequestException("Nhập nội dung tối đa 1.000 ký tự hoặc chọn một ảnh.");
        if (rooms.sentRecently(id, user)) throw new ConflictException("Bạn đang gửi quá nhanh. Hãy thử lại.");
        if (file != null && rooms.imageCount(id) >= 20)
            throw new ConflictException("Lịch sử gần đây của phòng đã có 20 ảnh.");
        rooms.send(id, user, clientId, body, file == null ? null : decodeImage(file));
    }

    @Transactional(readOnly = true)
    public RoomRepository.Image image(UUID id, long messageId) {
        return rooms.image(id, messageId, currentUser())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh trong phòng."));
    }

    @Transactional(readOnly = true)
    public long authorizeSocket(UUID id) {
        long user = currentUser();
        requireMember(id, user, false);
        return user;
    }

    @Transactional(readOnly = true)
    public boolean socketMembership(UUID id, long user) {
        return rooms.find(id, false).isPresent() && rooms.member(id, user);
    }

    private RoomRepository.Room requireRoom(UUID id, boolean lock) {
        return rooms.find(id, lock).orElseThrow(() -> new ResourceNotFoundException("Phòng không tồn tại hoặc đã đóng."));
    }

    private RoomRepository.Room requireMember(UUID id, long user, boolean lock) {
        var room = requireRoom(id, lock);
        if (!rooms.member(id, user)) throw new ResourceNotFoundException("Bạn chưa tham gia phòng này.");
        return room;
    }

    private long currentUser() { return security.getCurrentUser().getId(); }

    private static RoomRepository.Image decodeImage(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > IMAGE_LIMIT)
            throw new BadRequestException("Hãy chọn ảnh JPG hoặc PNG tối đa 2 MB.");
        try (var raw = file.getInputStream(); var input = new MemoryCacheImageInputStream(raw)) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new BadRequestException("Không đọc được ảnh JPG hoặc PNG.");
            var reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                if (!List.of("jpeg", "png").contains(format))
                    throw new BadRequestException("Phòng chỉ hỗ trợ ảnh JPG hoặc PNG.");
                reader.setInput(input, true, true);
                if (reader.getWidth(0) > 2800 || reader.getHeight(0) > 2800)
                    throw new BadRequestException("Ảnh cần nhỏ hơn hoặc bằng 2.800 × 2.800 pixel.");
                var bytes = new ByteArrayOutputStream();
                try (var output = new MemoryCacheImageOutputStream(bytes)) {
                    if (!ImageIO.write(reader.read(0), format, output)) throw new IOException("No image writer");
                }
                if (bytes.size() > IMAGE_LIMIT) throw new BadRequestException("Ảnh sau xử lý vượt 2 MB. Hãy dùng ảnh nhỏ hơn.");
                return new RoomRepository.Image("image/" + format, bytes.toByteArray());
            } finally { reader.dispose(); }
        } catch (IOException | IllegalArgumentException ex) {
            throw new BadRequestException("Ảnh bị lỗi hoặc không đúng định dạng.");
        }
    }
}
