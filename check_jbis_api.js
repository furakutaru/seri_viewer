// 本番環境のJBISリンク状況を確認

async function checkJbisStatus() {
  try {
    // 全馬データを取得
    const response = await fetch('https://seri-viewer.vercel.app/api/trpc/horses.getAll?input=%7B%22json%22%3A%22%7B%7D%22%7D');
    const data = await response.json();
    
    // データ構造を解析（tRPCのレスポンス形式）
    let horses = [];
    if (data.result && data.result.data && data.result.data.json) {
      horses = data.result.data.json;
    } else if (data.data && data.data.json) {
      horses = data.data.json;
    } else if (Array.isArray(data)) {
      horses = data;
    }
    
    console.log('=== 本番環境JBISリンク状況 ===');
    console.log('総馬数:', horses.length);
    
    // JBIS URLの有無を集計
    const withJbis = horses.filter(h => h.jbisUrl && h.jbisUrl.trim() !== '');
    const withoutJbis = horses.filter(h => !h.jbisUrl || h.jbisUrl.trim() === '');
    
    console.log('JBIS URLあり:', withJbis.length);
    console.log('JBIS URLなし:', withoutJbis.length);
    
    // 上場番号の範囲を確認
    const lotNumbers = horses.map(h => h.lotNumber).filter(n => n).sort((a, b) => a - b);
    console.log('上場番号範囲:', Math.min(...lotNumbers), '-', Math.max(...lotNumbers));
    
    // JBIS URLがない馬の上場番号を表示（最初20件）
    if (withoutJbis.length > 0) {
      console.log('\n=== JBIS URLがない馬（最初20件）===');
      withoutJbis.slice(0, 20).forEach(h => {
        console.log(`上場番号: ${h.lotNumber}, 馬名: ${h.name}`);
      });
    }
    
    // 100件ごとの集計
    console.log('\n=== 100件ごとのJBISリンク状況 ===');
    for (let i = 1; i <= 1462; i += 100) {
      const end = Math.min(i + 99, 1462);
      const rangeHorses = horses.filter(h => h.lotNumber >= i && h.lotNumber <= end);
      const withUrl = rangeHorses.filter(h => h.jbisUrl && h.jbisUrl.trim() !== '');
      console.log(`${i}-${end}: ${withUrl.length}/${rangeHorses.length}件`);
    }
    
    return {
      total: horses.length,
      withJbis: withJbis.length,
      withoutJbis: withoutJbis.length
    };
    
  } catch (error) {
    console.error('エラー:', error);
    return null;
  }
}

checkJbisStatus();
