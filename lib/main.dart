// lib/main.dart - FINAL CORRECTED CODE
import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flame/input.dart';
import 'package:flutter/material.dart' hide Image;
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(GameWidget(game: NeonPongGame()));
}

enum Difficulty { easy, normal, hard, insane }

class NeonPongGame extends FlameGame with HasTappables, HasDraggables, TapDetector {
  late Paddle player, computer;
  late Ball ball;
  late TextComponent scoreText, highScoreText;
  late AudioPlayer musicPlayer;
  late AudioPlayer sfxPlayer;
  bool soundEnabled = true;
  Difficulty difficulty = Difficulty.normal;
  int highScore = 0;

  // neon styles
  final Paint neonPaint = Paint()
    ..style = PaintingStyle.stroke
    ..strokeWidth = 4
    ..color = const Color(0xFFFF2B2B); // neon red

  final Paint neonFill = Paint()
    ..style = PaintingStyle.fill
    ..color = const Color(0xFF220000);

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    // dimensions and paddles
    final paddleWidth = size.x * 0.02;
    final paddleHeight = size.y * 0.18;

    player = Paddle(Vector2(paddleWidth + 10, (size.y - paddleHeight) / 2),
        Vector2(paddleWidth, paddleHeight));
    computer = Paddle(Vector2(size.x - paddleWidth - 10 - paddleWidth, (size.y - paddleHeight) / 2),
        Vector2(paddleWidth, paddleHeight));

    add(player);
    add(computer);

    ball = Ball(Vector2(size.x / 2 - 10, size.y / 2 - 10), Vector2.all(20));
    add(ball);

    scoreText = TextComponent(
      text: 'Score: 0',
      position: Vector2(size.x / 2 - 40, 12),
      anchor: Anchor.topCenter,
      textRenderer: TextPaint(
        style: const TextStyle(color: Colors.redAccent, fontSize: 20, fontFamily: 'Roboto'),
      ),
    );
    add(scoreText);

    highScore = await _loadHighScore();
    highScoreText = TextComponent(
      text: 'High: $highScore',
      position: Vector2(size.x - 80, 12),
      anchor: Anchor.topRight,
      textRenderer: TextPaint(
        style: const TextStyle(color: Colors.redAccent, fontSize: 16),
      ),
    );
    add(highScoreText);

    // audio
    musicPlayer = AudioPlayer();
    sfxPlayer = AudioPlayer();

    // loop music file from assets
    try {
      await musicPlayer.setSource(AssetSource('8-bit-loop-music-290770.mp3'));
      musicPlayer.setReleaseMode(ReleaseMode.loop);
      if (soundEnabled) musicPlayer.resume();
    } catch (e) {
      // fallback silently
    }

    // serve ball
    ball.serve();
  }

  double get aiSpeed {
    switch (difficulty) {
      case Difficulty.easy:
        return 2;
      case Difficulty.normal:
        return 3;
      case Difficulty.hard:
        return 5;
      case Difficulty.insane:
        return 8;
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (ball.outLeft(size.x) || ball.outRight(size.x)) {
      // reset serve after awarding point
      if (ball.outLeft(size.x)) {
        // computer scored
      } else {
        player.score++;
        scoreText.text = 'Score: ${player.score}';
        if (player.score > highScore) {
          highScore = player.score;
          highScoreText.text = 'High: $highScore';
          _saveHighScore(highScore);
        }
      }
      ball.reset(size);
      ball.serve();
    }

    // AI movement: follow ball
    if (computer.center.y < ball.center.y - 6) {
      computer.position.add(Vector2(0, aiSpeed));
    } else if (computer.center.y > ball.center.y + 6) {
      computer.position.add(Vector2(0, -aiSpeed));
    }

    // keep paddles in bounds
    player.clampToScreen(size.y);
    computer.clampToScreen(size.y);
  }

  @override
  void onTapDown(TapDownInfo info) {
    if (ball.isStopped) {
      player.score = 0;
      scoreText.text = 'Score: 0';
      ball.reset(size);
      ball.serve();
    }
    super.onTapDown(info);
  }

  @override
  void onDragUpdate(int pointerId, DragUpdateInfo info) {
    if (info.eventPosition.global.x < size.x * 0.4) {
      player.center = Vector2(player.center.x, info.eventPosition.global.y);
    }
    super.onDragUpdate(pointerId, info);
  }

  void playHit() {
    if (!soundEnabled) return;
    sfxPlayer.play(AssetSource('hit.wav'));
  }

  void playOver() {
    if (!soundEnabled) return;
    sfxPlayer.play(AssetSource('over.wav'));
  }

  Future<int> _loadHighScore() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('high_score') ?? 0;
  }

  Future<void> _saveHighScore(int v) async {
    final prefs = await SharedPreferences.getInstance();
    prefs.setInt('high_score', v);
  }

  // settings controls (could be called from an overlay)
  void toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) musicPlayer.resume();
    else musicPlayer.pause();
  }

  void setDifficulty(Difficulty d) {
    difficulty = d;
  }
}

class Paddle extends PositionComponent {
  int score = 0;
  Paddle(Vector2 position, Vector2 size) : super(position: position, size: size, anchor: Anchor.topLeft);

  Vector2 get center => Vector2(position.x + width / 2, position.y + height / 2);
  set center(Vector2 v) => position = Vector2(position.x - width / 2, v.y - height / 2);

  void clampToScreen(double height) {
    if (position.y < 0) position.y = 0;
    if (position.y + this.height > height) position.y = height - this.height;
  }

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(position.x, position.y, width, height);
    final fillPaint = Paint()..color = const Color(0xFF220000);
    canvas.drawRect(rect, fillPaint);

    final glow = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..color = const Color(0xFFFF3B3B).withOpacity(.9);
    canvas.drawRect(rect.inflate(2), glow);
  }
}

class Ball extends PositionComponent with HasGameRef<NeonPongGame> {
  Vector2 velocity = Vector2.zero();
  bool isStopped = false;

  Ball(Vector2 position, Vector2 size) : super(position: position, size: size, anchor: Anchor.topLeft);

  Vector2 get center => Vector2(position.x + width / 2, position.y + height / 2);

  void serve() {
    final rand = Random();
    final dx = rand.nextBool() ? 200 : -200;
    final dy = (rand.nextDouble() * 200) - 100;
    velocity = Vector2(dx, dy) / 60.0;
    isStopped = false;
  }

  void reset(Vector2 screenSize) {
    position = Vector2(screenSize.x / 2 - width / 2, screenSize.y / 2 - height / 2);
    velocity = Vector2.zero();
    isStopped = true;
  }

  bool outLeft(double w) => position.x <= -width;
  bool outRight(double w) => position.x >= w;

  @override
  void update(double dt) {
    super.update(dt);
    if (isStopped) return;

    position += velocity;

    // bounce top/bottom
    if (position.y <= 0 || position.y + height >= gameRef.size.y) {
      velocity.y = -velocity.y;
    }

    // collide with paddles
    final paddleRect = Rect.fromLTWH(gameRef.player.position.x, gameRef.player.position.y, gameRef.player.width, gameRef.player.height);
    final compRect = Rect.fromLTWH(gameRef.computer.position.x, gameRef.computer.position.y, gameRef.computer.width, gameRef.computer.height);
    final ballRect = Rect.fromLTWH(position.x, position.y, width, height);

    if (ballRect.overlaps(paddleRect) && velocity.x < 0) {
      velocity.x = -velocity.x * 1.05;
      velocity.y += (Random().nextDouble() * 4 - 2);
      gameRef.playHit();
    } else if (ballRect.overlaps(compRect) && velocity.x > 0) {
      velocity.x = -velocity.x * 1.05;
      velocity.y += (Random().nextDouble() * 4 - 2);
      gameRef.playHit();
    }

    // clamp speed
    final maxSpeed = 15.0;
    if (velocity.distance > maxSpeed) velocity = velocity.normalized() * maxSpeed;
  }

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(position.x, position.y, width, height);
    final fill = Paint()..color = const Color(0xFF220000);
    canvas.drawOval(rect, fill);

    final glow = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..color = const Color(0xFFFF3B3B).withOpacity(.95);
    canvas.drawOval(rect.inflate(4), glow);
  }
}
