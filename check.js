// check.js 파일의 내용입니다.
const axios = require('axios');
const qs = require('querystring');

// GitHub Actions의 환경 변수에서 설정값을 가져옵니다.
const PRODUCT_ID = process.env.PRODUCT_ID;
const SCHEDULE_ID = process.env.SCHEDULE_ID;
const SEAT_GRADES_TO_CHECK = JSON.parse(process.env.SEAT_IDS_JSON);
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// --- 여기부터는 수정할 필요 없습니다 ---

const performancePageUrl = `https://ticket.melon.com/performance/index.htm?prodId=${PRODUCT_ID}`;

const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://ticket.melon.com',
    'Referer': performancePageUrl,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function checkAllSeats() {
    console.log('좌석 정보를 확인합니다...');
    for (const grade of SEAT_GRADES_TO_CHECK) {
        try {
            const response = await axios.post(
                'https://ticket.melon.com/tktapi/product/seatStateInfo.json?v=1',
                qs.stringify({ prodId: PRODUCT_ID, scheduleNo: SCHEDULE_ID, seatId: grade.id, volume: 1, selectedGradeVolume: 1 }),
                { headers: headers }
            );

            if (response.data && response.data.chkResult) {
                console.log(`성공! '${grade.name}' 좌석 발견!`);
                const message = `**${grade.name}** 티켓 발견! 지금 바로 예매하세요!\n${performancePageUrl}`;
                await axios.post(SLACK_WEBHOOK_URL, { text: message });
                console.log('Slack 알림 전송 완료.');
                process.exit(0);
            } else {
                const seatCount = response.data?.data?.seatGradeList?.[0]?.remainSeatCnt || 0;
                console.log(`'${grade.name}': ${seatCount}석`);
            }
        } catch (error) {
            console.error(`'${grade.name}' 확인 중 오류 발생:`, error.message);
        }
    }
    console.log('빈자리를 찾지 못했습니다.');
}

checkAllSeats();
