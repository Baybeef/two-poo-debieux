import React, { useEffect, useState, useRef } from 'react';

const Game = () => {
  const squareSize = 500;
  const playerSize = 20;
  const maxSpeed = 3;

  const [character, setCharacter] = useState({
    x: squareSize / 2,
    y: squareSize / 2,
    speed: 0,
    direction: { x: 0, y: 0 },
  });

  const [target, setTarget] = useState({
    x: Math.random() * (squareSize - playerSize),
    y: Math.random() * (squareSize - playerSize),
  });

  const [enemies, setEnemies] = useState([
    {
      x: Math.random() * (squareSize - playerSize),
      y: Math.random() * (squareSize - playerSize),
      direction: getRandomDirection(),
    },
  ]);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const storedHighScore = localStorage.getItem('highScore');
    return storedHighScore ? parseInt(storedHighScore, 10) : 0;
  });

  const [gameStarted, setGameStarted] = useState(false);

  const keys = useRef<{ [key: string]: boolean }>({});
  const gameOver = useRef(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    keys.current = { ...keys.current, [e.key]: true };
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    e.preventDefault();
    keys.current = { ...keys.current, [e.key]: false };
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const initializeGame = () => {
    setCharacter({
      x: squareSize / 2,
      y: squareSize / 2,
      speed: 0,
      direction: { x: 0, y: 0 },
    });
    setTarget({
      x: Math.random() * (squareSize - playerSize),
      y: Math.random() * (squareSize - playerSize),
    });
    setEnemies([
      {
        x: Math.random() * (squareSize - playerSize),
        y: Math.random() * (squareSize - playerSize),
        direction: getRandomDirection(),
      },
    ]);
    setScore(0);
    gameOver.current = false;
  };

  const restartGame = () => {
    initializeGame();
    setGameStarted(true);
  };

  useEffect(() => {
    if (gameStarted) {
      let animationFrameId: number;

      const moveCharacter = () => {
        if (!gameOver.current) {
          setCharacter((prevCharacter) => {
            const direction = { x: 0, y: 0 };

            if (keys.current['ArrowLeft']) {
              direction.x -= 1;
            }
            if (keys.current['ArrowRight']) {
              direction.x += 1;
            }
            if (keys.current['ArrowUp']) {
              direction.y -= 1;
            }
            if (keys.current['ArrowDown']) {
              direction.y += 1;
            }

            const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);

            if (magnitude !== 0) {
              direction.x /= magnitude;
              direction.y /= magnitude;
            }

            const newCharacter = {
              ...prevCharacter,
              direction,
              speed:
                keys.current['ArrowLeft'] ||
                  keys.current['ArrowRight'] ||
                  keys.current['ArrowUp'] ||
                  keys.current['ArrowDown']
                  ? maxSpeed
                  : 0,
              x: Math.max(
                0,
                Math.min(squareSize - playerSize, prevCharacter.x + direction.x * prevCharacter.speed)
              ),
              y: Math.max(
                0,
                Math.min(squareSize - playerSize, prevCharacter.y + direction.y * prevCharacter.speed)
              ),
            };

            // Check collision with enemies
            if (
              enemies.some(
                (enemy) =>
                  newCharacter.x < enemy.x + playerSize &&
                  newCharacter.x + playerSize > enemy.x &&
                  newCharacter.y < enemy.y + playerSize &&
                  newCharacter.y + playerSize > enemy.y
              )
            ) {
              gameOver.current = true;
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('highScore', score.toString());
              }
            }

            return newCharacter;
          });
        }

        animationFrameId = requestAnimationFrame(moveCharacter);
      };

      moveCharacter();

      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [squareSize, playerSize, enemies, gameStarted]);

  useEffect(() => {
    if (gameStarted) {
      let enemiesAnimationFrameId: number;

      const moveEnemies = () => {
        setEnemies((prevEnemies) =>
          prevEnemies.map((prevEnemy) => {
            const newEnemy = { ...prevEnemy };

            if (newEnemy.direction.x !== 0) {
              newEnemy.x += newEnemy.direction.x * maxSpeed;

              if (newEnemy.x < 0 || newEnemy.x > squareSize - playerSize) {
                newEnemy.direction.x *= -1; // Reverse direction when hitting the sides
              }
            } else {
              newEnemy.y += newEnemy.direction.y * maxSpeed;

              if (newEnemy.y < 0 || newEnemy.y > squareSize - playerSize) {
                newEnemy.direction.y *= -1; // Reverse direction when hitting the top or bottom
              }
            }

            return newEnemy;
          })
        );

        enemiesAnimationFrameId = requestAnimationFrame(moveEnemies);
      };

      moveEnemies();

      return () => cancelAnimationFrame(enemiesAnimationFrameId);
    }
  }, [squareSize, playerSize, gameStarted]);

  useEffect(() => {
    if (gameStarted) {
      // Check collision with target
      if (
        character.x < target.x + playerSize &&
        character.x + playerSize > target.x &&
        character.y < target.y + playerSize &&
        character.y + playerSize > target.y
      ) {
        setScore((prevScore) => prevScore + 5);
        setTarget({
          x: Math.random() * (squareSize - playerSize),
          y: Math.random() * (squareSize - playerSize),
        });
        setEnemies((prevEnemies) => [
          ...prevEnemies,
          {
            x: Math.random() * (squareSize - playerSize),
            y: Math.random() * (squareSize - playerSize),
            direction: getRandomDirection(),
          },
        ]);
      }
    }
  }, [character, target, gameStarted]);

  function getRandomDirection() {
    // Randomly choose either horizontal or vertical movement
    return Math.random() < 0.5 ? { x: 1, y: 0 } : { x: 0, y: 1 };
  }

  function getGameOverMessage() {
    if (score < 50) {
      return "You're shit!";
    } else if (score < 100) {
      return 'Not poo bad!';
    } else {
      return 'IBS is no match for you!';
    }
  }

  return (
    <div style={{ textAlign: 'center', backgroundColor: 'brown', paddingBottom: '20px' }}>
      <h1 style={{ color: 'white', margin: '0' }}>Two Poo Debieux</h1>
      {!gameStarted && (
        <>
          <p style={{ color: 'white' }}>
            Embark on a journey with our IBS-ridden hero, Two Poo Debieux, as he navigates the treacherous terrain of intestinal chaos.
            Armed with the uncanny ability to summon uncontrollable bouts of diarrhea, Two Poo must collect toilet rolls to maintain his dignity 
            and avoid being pelted by explosive shit attacks. Can Two Poo Debieux conquer the shitstorm and avoid craptastrophe?
          </p>
          <button style={{ fontSize: '18px', padding: '10px' }} onClick={() => setGameStarted(true)}>
            Play Now
          </button>
        </>
      )}
      {gameStarted && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ marginRight: '20px', color: 'white' }}>
              <strong>Current Score:</strong> {score}
            </div>
            <div style={{ color: 'white' }}>
              <strong>High Score:</strong> {highScore}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <div
              style={{
                position: 'relative',
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                border: '1px solid black',
                backgroundColor: 'green',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${character.x}px`,
                  top: `${character.y}px`,
                  fontSize: '20px',
                }}
              >
                👨‍🦱
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  fontSize: '20px',
                }}
              >
                🧻
              </div>
              {enemies.map((enemy, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${enemy.x}px`,
                    top: `${enemy.y}px`,
                    fontSize: '20px',
                  }}
                >
                  💩
                </div>
              ))}
              {gameOver.current && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '30px',
                    textAlign: 'center',
                    backgroundColor: 'brown',
                    padding: '20px',
                    borderRadius: '10px',
                    color: 'white',
                  }}
                >
                  <strong><p>{getGameOverMessage()}</p></strong>
                  <p>Your Score: {score}</p>
                  <p>High Score: {highScore}</p>
                  <button
                    style={{
                      fontSize: '18px',
                      padding: '10px',
                      backgroundColor: 'white',
                      color: 'brown',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={restartGame}
                  >
                    Restart
                  </button>
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default Game;
