const gongGrid = document.getElementById('gong-grid');
const suGrid = document.getElementById('su-grid');
const downloadBtn = document.getElementById('download-btn');
const canvas = document.getElementById('merge-canvas');
const ctx = canvas.getContext('2d');

// 크롭 관련 엘리먼트
const modal = document.getElementById('cropper-modal');
const cropperImage = document.getElementById('cropper-image');
const cropCancelBtn = document.getElementById('crop-cancel-btn');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');

let cropper = null;
let currentTarget = { array: null, index: null, cellElement: null };

const gongImages = Array(12).fill(null);
const suImages = Array(12).fill(null);

// 1. 그리드 생성 및 클릭 이벤트 (크롭 팝업 연동)
function createGrid(gridElement, imageArray) {
    for (let i = 0; i < 12; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;

        cell.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            fileInput.onchange = (e) => {
                const file = e.target.value ? e.target.files[0] : null;
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    // 현재 선택한 칸 정보 기록
                    currentTarget.array = imageArray;
                    currentTarget.index = i;
                    currentTarget.cellElement = cell;

                    // 모달창 띄우고 크롭 이미지 소스 변경
                    cropperImage.src = event.target.result;
                    modal.style.display = 'flex';

                    // 이전 크롭 인스턴스 파괴 후 재생성
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(cropperImage, {
                        aspectRatio: 1, // 1:1 정사각형 고정
                        viewMode: 1,
                        background: false
                    });
                };
                reader.readAsDataURL(file);
            };
            fileInput.click();
        });
        gridElement.appendChild(cell);
    }
}

createGrid(gongGrid, gongImages);
createGrid(suGrid, suImages);

// 크롭 취소 버튼
cropCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (cropper) cropper.destroy();
});

// 크롭 완료 버튼 클릭 시
cropConfirmBtn.addEventListener('click', () => {
    if (!cropper) return;

    // 크롭된 이미지를 캔버스로 가져와서 가로세로 300px 짜리 고화질로 추출
    const croppedCanvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    
    const img = new Image();
    img.src = croppedCanvas.toDataURL();
    img.onload = () => {
        // 배열과 화면에 저장
        currentTarget.array[currentTarget.index] = img;
        currentTarget.cellElement.style.backgroundImage = `url(${img.src})`;
        currentTarget.cellElement.classList.add('has-img');
        
        modal.style.display = 'none';
        cropper.destroy();
    };
});

// 2. 최종 이미지 합성 및 다운로드
downloadBtn.addEventListener('click', () => {
    const templateImg = new Image();
    templateImg.src = 'template.png';

    templateImg.onload = () => {
        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        ctx.drawImage(templateImg, 0, 0);

        // 💡 [실제 템플릿에 맞춤] 
        // 업로드 창이 1:1로 정확히 잘리기 때문에, 아래 수치만 실제 칸에 맞추면 안 찌그러집니다!
        const cellWidth = 100;  
        const cellHeight = 100; 
        const gap = 6;          

        const gongGridX = 40;   
        const suGridX = 510;    
        const gridY = 260;      

        drawCells(gongImages, gongGridX, gridY, cellWidth, cellHeight, gap);
        drawCells(suImages, suGridX, gridY, cellWidth, cellHeight, gap);

        const link = document.createElement('a');
        link.download = 'gong_su_analysis.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
});

function drawCells(images, startX, startY, w, h, gap) {
    for (let i = 0; i < 12; i++) {
        if (images[i]) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * (w + gap);
            const y = startY + row * (h + gap);
            ctx.drawImage(images[i], x, y, w, h);
        }
    }
}
