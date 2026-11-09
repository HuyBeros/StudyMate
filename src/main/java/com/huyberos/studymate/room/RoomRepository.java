package com.huyberos.studymate.room;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
class RoomRepository {
    private final JdbcClient db;

    record Room(UUID id, long ownerId, String name, RoomTimer timer, long revision, Instant expiresAt) {}
    record Member(long id, String name) {}
    record Message(long id, long senderId, String sender, String text, boolean image, Instant sentAt) {}
    record Image(String type, byte[] bytes) {}

    Optional<Room> find(UUID id, boolean lock) {
        return db.sql("SELECT * FROM study_room WHERE id = ? AND expires_at > now()" + (lock ? " FOR UPDATE" : ""))
                .param(id).query((row, i) -> {
                    var deadline = row.getTimestamp("deadline");
                    var timer = new RoomTimer(RoomTimer.Phase.valueOf(row.getString("phase")),
                            deadline == null ? null : deadline.toInstant(), row.getLong("remaining_ms"));
                    return new Room(id, row.getLong("owner_id"), row.getString("name"), timer,
                            row.getLong("revision"), row.getTimestamp("expires_at").toInstant());
                }).optional();
    }

    void create(UUID id, long owner, String name, Instant expiresAt) {
        db.sql("INSERT INTO study_room (id, owner_id, name, expires_at) VALUES (?, ?, ?, ?)")
                .params(id, owner, name, Timestamp.from(expiresAt)).update();
    }

    void purgeExpired() {
        db.sql("DELETE FROM study_room WHERE expires_at <= now()").update();
    }

    long ownedCount(long owner) {
        return db.sql("SELECT count(*) FROM study_room WHERE owner_id = ? AND expires_at > now()")
                .param(owner).query(Long.class).single();
    }

    void lockOwner(long owner) {
        db.sql("SELECT id FROM app_user WHERE id = ? FOR UPDATE").param(owner).query(Long.class).single();
    }

    List<RoomService.RoomLink> joinedRooms(long user) {
        return db.sql("""
                SELECT r.id, r.name, r.owner_id = ? AS host FROM study_room r
                JOIN study_room_member m ON m.room_id = r.id
                WHERE m.user_id = ? AND r.expires_at > now() ORDER BY m.joined_at DESC
                """).params(user, user).query((row, i) -> new RoomService.RoomLink(
                row.getObject("id", UUID.class), row.getString("name"), row.getBoolean("host"))).list();
    }

    List<Member> members(UUID id) {
        return db.sql("""
                SELECT u.id, u.full_name FROM study_room_member m JOIN app_user u ON u.id = m.user_id
                WHERE m.room_id = ? ORDER BY m.joined_at, u.id
                """).param(id).query((row, i) -> new Member(row.getLong(1), row.getString(2))).list();
    }

    boolean member(UUID room, long user) {
        return db.sql("SELECT EXISTS (SELECT 1 FROM study_room_member WHERE room_id = ? AND user_id = ?)")
                .params(room, user).query(Boolean.class).single();
    }

    void add(UUID room, long user) {
        db.sql("INSERT INTO study_room_member(room_id, user_id) VALUES (?, ?)")
                .params(room, user).update();
    }

    void remove(UUID room, long user) {
        db.sql("DELETE FROM study_room_member WHERE room_id = ? AND user_id = ?")
                .params(room, user).update();
    }

    void close(UUID room) {
        db.sql("DELETE FROM study_room WHERE id = ?").param(room).update();
    }

    void updateTimer(UUID room, RoomTimer timer) {
        db.sql("UPDATE study_room SET phase=?, deadline=?, remaining_ms=?, revision=revision+1 WHERE id=?")
                .param(timer.phase().name()).param(timer.deadline() == null ? null : Timestamp.from(timer.deadline()))
                .param(timer.remainingMs()).param(room).update();
    }

    List<Message> messages(UUID id) {
        return db.sql("""
                SELECT * FROM (
                    SELECT m.id, m.user_id, u.full_name, m.body, m.image_type IS NOT NULL AS has_image, m.sent_at
                    FROM study_room_message m JOIN app_user u ON u.id = m.user_id
                    WHERE m.room_id = ? ORDER BY m.id DESC LIMIT 100
                ) recent ORDER BY id
                """).param(id).query((row, i) -> new Message(row.getLong("id"), row.getLong("user_id"),
                row.getString("full_name"), row.getString("body"), row.getBoolean("has_image"),
                row.getTimestamp("sent_at").toInstant())).list();
    }

    boolean alreadySent(UUID room, long user, UUID clientId) {
        return db.sql("SELECT EXISTS (SELECT 1 FROM study_room_message WHERE room_id=? AND user_id=? AND client_id=?)")
                .params(room, user, clientId).query(Boolean.class).single();
    }

    boolean sentRecently(UUID room, long user) {
        return db.sql("""
                SELECT EXISTS (SELECT 1 FROM study_room_message WHERE room_id = ? AND user_id = ?
                AND sent_at > now() - interval '600 milliseconds')
                """).params(room, user).query(Boolean.class).single();
    }

    long imageCount(UUID room) {
        return db.sql("SELECT count(*) FROM study_room_message WHERE room_id=? AND image_type IS NOT NULL")
                .param(room).query(Long.class).single();
    }

    void send(UUID room, long user, UUID clientId, String text, Image image) {
        db.sql("INSERT INTO study_room_message(room_id, user_id, client_id, body, image_type, image_bytes) VALUES (?, ?, ?, ?, ?, ?)")
                .param(room).param(user).param(clientId).param(text)
                .param(image == null ? null : image.type()).param(image == null ? null : image.bytes()).update();
        db.sql("""
                DELETE FROM study_room_message WHERE room_id = ? AND id < (
                    SELECT id FROM study_room_message WHERE room_id = ? ORDER BY id DESC OFFSET 99 LIMIT 1
                )
                """).params(room, room).update();
    }

    Optional<Image> image(UUID room, long id, long user) {
        return db.sql("""
                SELECT image_type, image_bytes FROM study_room_message m
                JOIN study_room r ON r.id=m.room_id
                JOIN study_room_member membership ON membership.room_id=r.id AND membership.user_id=?
                WHERE m.room_id=? AND m.id=? AND r.expires_at > now() AND m.image_type IS NOT NULL
                """).params(user, room, id).query((row, i) -> new Image(row.getString(1), row.getBytes(2))).optional();
    }
}
