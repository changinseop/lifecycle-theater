# Customer Lifecycle Theater - 작업 로그

## 최종 업데이트: 2025-01-22

---

## 📁 프로젝트 구조
```
lifecycle/
├── src/
│   ├── app/page.tsx              # 메인 페이지 (탭 순서: Cohort → Racing → Sankey → ...)
│   ├── components/theater/
│   │   ├── cohort-view.tsx       # 코호트 리텐션 분석
│   │   ├── racing-view.tsx       # 고객 방문 패턴 (평균 근접 샘플링)
│   │   ├── sankey-view.tsx       # Sankey 플로우
│   │   ├── survival-curve.tsx    # 생존 곡선 (실제 데이터)
│   │   ├── predictor.tsx         # AI 예측 (ONNX 모델)
│   │   └── ...
│   └── lib/
│       ├── data/
│       │   ├── racing-data-v2.json   # 2,500명 고객 데이터
│       │   └── sankey-data.ts        # Sankey 노드/링크
│       └── model/
│           └── predictor-model.ts    # ONNX 모델 로드/추론
├── public/model/
│   ├── customer_predictor.onnx   # Attention-LSTM 모델 (75KB)
│   └── model_metadata.json       # 모델 메타데이터
├── scripts/
│   ├── train_model.py            # PyTorch 학습 스크립트
│   ├── basket_analysis.py        # 장바구니 분석 v1
│   └── basket_analysis_v2.py     # 장바구니 분석 v2
└── .venv/                        # Python 가상환경 (PyTorch, ONNX)
```

---

## ✅ 완료된 작업

### 1. UI/UX 개선
- [x] 탭 순서 변경: Cohort를 맨 앞으로
- [x] 코호트 인사이트 텍스트 제거 (데이터와 불일치)
- [x] Racing view 샘플링 방식 변경: 분산 샘플링 → **평균 근접 샘플링**
- [x] Racing view 높이 조정 (700px)
- [x] Sankey 고아 노드 "활성" 제거
- [x] Sankey 카드 애니메이션 개선 (spring physics)
- [x] StatsPanel, InsightPanel 제거 및 레이아웃 확장 (1920px)

### 2. AI 예측 모델 구현
- [x] **PyTorch Attention-LSTM 모델** 학습
  - 학습 데이터: 43,967개 시퀀스
  - 정확도: 64%
  - M2 MPS 가속 사용
- [x] **ONNX 형식 export** (단일 파일, 외부 데이터 없음)
- [x] **onnxruntime-web** 브라우저 연동
- [x] Predictor 컴포넌트 업데이트

### 3. 장바구니 분석 (신규)
- [x] Dunnhumby 원본 데이터 분석
- [x] 상태별 장바구니 구성 비교
- [x] 이탈 예측 피처 도출

---

## 📊 장바구니 분석 결과

### 최종 상태별 장바구니 구성
| 카테고리 | VIP | 충성 | 활성 | 위험 | 이탈 |
|---------|-----|------|------|------|------|
| 식료품 | 47.2% | 50.0% | 51.6% | 52.6% | 51.6% |
| **주유** | **9.4%** | **8.9%** | 5.2% | 4.5% | 6.0% |
| 신선농산 | 6.1% | 7.3% | 6.9% | 7.2% | 6.2% |
| 생활용품 | 14.1% | 12.8% | 13.4% | 12.5% | 12.7% |

### 구매 금액/빈도 비교
| 지표 | VIP | 충성 | 이탈 |
|------|-----|------|------|
| 총 구매액 | $10,688 | $6,712 | $1,322 |
| 방문 횟수 | 548회 | 200회 | 47회 |
| 활동 기간 | 649일 | 638일 | 548일 |

### 핵심 발견
1. **주유(KIOSK-GAS)가 충성도 지표** - VIP 9.4% vs 이탈 6.0%
2. **방문 빈도가 가장 확실한 이탈 신호**
3. 카테고리 비율 자체는 큰 차이 없음

---

## ⏳ 진행 중 / 미완료

### Predict 탭 개선 필요
현재 문제:
- 64% 정확도 (낮음)
- 수동 시퀀스 입력 방식 (비실용적)

개선 방향:
1. 실제 고객 선택 → 자동 시퀀스 로드
2. "이탈 위험 고객 TOP 10" 표시
3. 장바구니 분석 결과 반영
4. What-If: "3개월 전 개입했다면?" 자동 계산

---

## 🔧 개발 환경

### 서버 실행
```bash
cd /Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/final/lifecycle
npm run dev
# http://localhost:3000
```

### Python 환경 (모델 학습)
```bash
source .venv/bin/activate
python scripts/train_model.py      # 모델 재학습
python scripts/basket_analysis_v2.py  # 장바구니 분석
```

### 주요 의존성
- Next.js 16.1.4 (Turbopack)
- onnxruntime-web
- PyTorch 2.10.0 (학습용)
- ONNX 1.20.1

---

## 📂 데이터 위치

- **고객 상태 데이터**: `src/lib/data/racing-data-v2.json`
- **Dunnhumby 원본**: `/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset/`
  - `transaction_data.csv` - 거래 내역 (2,595,732건)
  - `product.csv` - 상품 정보 (92,353개)
  - `hh_demographic.csv` - 가구 정보

---

## 💬 마지막 논의 사항

**사용자 피드백:**
> "학습모델 적중률이 너무 낮은거 아니야? 그리고 저렇게 시퀀스를 내가 6개 경로를 바꾸면서 시뮬하는게 어떤 의미가 있는거지?"

> "퍼널 분석측면에서 충성 -> 이탈이 되는등 이렇게 전환되는 이유에 대해 장바구니 분석을 해봐야하지 않을까?"

**분석 결과:** 장바구니 카테고리보다 **방문 빈도**와 **주유 이용 여부**가 더 중요한 이탈 예측 지표

**다음 작업:** Predict 탭에 장바구니 분석 결과 반영 방안 결정 필요
