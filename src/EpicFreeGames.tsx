import { useEffect, useState } from 'react';

interface GameInfo {
  title: string;
  freeUntil: string;
}

const EpicFreeGames = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://store.epicgames.com/zh-CN/');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        const gameElements = doc.querySelectorAll('.css-1myhtyb');
        const gameData: GameInfo[] = [];
        
        gameElements.forEach(element => {
          const title = element.querySelector('.css-1h2ruwl')?.textContent?.trim();
          const freeUntil = element.querySelector('.css-1kq7b3r')?.textContent?.trim();
          
          if (title && freeUntil) {
            gameData.push({ title, freeUntil });
          }
        });
        
        setGames(gameData);
      } catch (err) {
        setError('无法获取免费游戏信息');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="epic-free-games">
      <h2>Epic 免费游戏</h2>
      <ul>
        {games.map((game, index) => (
          <li key={index}>
            <h3>{game.title}</h3>
            <p>免费截止时间: {game.freeUntil}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EpicFreeGames;