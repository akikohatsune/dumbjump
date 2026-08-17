# dumbjump

## Tóm tắt nhanh

Sau khi xem bundle của game, tôi có thể tóm gon một số điều

Speedrun nhanh cho các bạn:

* `?demo` gần như bật **God Mode + Auto Play**.
* Game instance được expose qua `__vhjWorld`.
* Best score nằm hoàn toàn trong `localStorage`.
* Voice control chủ yếu chỉ bọc quanh Web Speech API.

game cẩu thả vl:)

---

## Những chỗ làm ẩu

### `?demo` vẫn tồn tại trên production

Game đọc trực tiếp query parameter:

```js
this.demo =
    new URLSearchParams(window.location.search)
        .has("demo")
```

Chỉ cần thêm:

```text
?demo
```
<img width="800" height="78" alt="{E13273BC-130A-41D7-9749-4D99DF99F8C4}" src="https://github.com/user-attachments/assets/089a21c8-d1a1-4460-ae3d-2d93d6a2ddf1" />

là game tự start.

Tệ hơn, logic collision còn kiểm tra `!this.demo` trước khi gọi `gameOver()`, nên demo đồng thời bỏ qua việc chết do obstacle.

Nói cách khác, chế độ test của developer đã được port nguyên lên production.

https://github.com/user-attachments/assets/c41d43eb-822f-49e7-bf7c-3c757b3159cb

---

### Game state được expose ra ngoài

Game lưu world instance trực tiếp vào scene:

```js
scene.__vhjWorld = world
```

Instance này chứa gần như toàn bộ state quan trọng:

```text
player
obstacles
score
distance
status
difficulty
demo
```

Đây là kiểu debug hook rất tiện lúc phát triển, nhưng không có lý do để giữ lại trong production.

---

### Best score chỉ là `localStorage`

Best score được đọc từ:

```js
localStorage.getItem("vhj-best")
```

Vì vậy nó có thể được thay đổi trực tiếp từ DevTools:

```js
localStorage.setItem("vhj-best", "999999");
```

Nếu đây chỉ là high score local thì không sao, nhưng nó hoàn toàn có khả năng chỉnh sửa.

<img width="528" height="303" alt="{482D727D-2161-466C-9C64-57CFABC1267E}" src="https://github.com/user-attachments/assets/64ba07b3-1919-4304-9260-96434593577b" />

---

### Voice control khá sơ sài

Game dùng microphone cùng `SpeechRecognition`, lấy transcript rồi kiểm tra một số từ:

```text
nhay
jump
leap
up
go
```

Nếu match thì gọi `jump()`.

Tức là “voice control” gần như chỉ là:

```text
Microphone
→ Browser SpeechRecognition
→ Regex keyword
→ jump()
```

Không có hệ thống phân tích âm thanh đặc biệt nào của game.

---

# Update: 

Hiện tại thì tôi đã cheat xong con game này r, như trước đó thôi:) yêu cầu tampermonkey và một chút kinh nghiệm về cách dùng tampermonkey. Bạn có thể cài nó qua [dumpjump.user.js](https://raw.githubusercontent.com/akikohatsune/dumbjump/refs/heads/main/dumpjump.user.js) sau đó thì tận hưởng thành quả thôi:)

https://github.com/user-attachments/assets/1ce471f1-c5c2-4ac3-9ea4-25799d3400de

---

## Kết luận

Như tôi đã nói hoặc chưa nói thì bạn cũng có thể hiểu cái game của l này làm ra chỉ để ragebait, còn chú ấy bảo tôi rảnh thì tôi rảnh thì tôi đang không có việc gì để làm=)))))

<img width="349" height="360" alt="image" src="https://github.com/user-attachments/assets/c209df3c-638f-4779-bbbe-b561a83eda6d" />

---

## License

CC0 cho các bạn phá nhé:)
