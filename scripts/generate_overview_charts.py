"""
Overview 페이지용 통계 시각화 - Consulting Firm Style
BCG/McKinsey 스타일: 다크 테마, 미니멀, 단색 계열
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ==========================================
# 폰트 설정
# ==========================================
plt.rcParams['font.family'] = 'Apple SD Gothic Neo'
plt.rcParams['axes.unicode_minus'] = False

# ==========================================
# 컨설팅 펌 스타일 - 극도로 미니멀
# ==========================================
# 단색 계열 팔레트 (회색 + 포인트 1색)
COLORS = {
    'bg': '#0f172a',
    'surface': '#1e293b',
    'text': '#e2e8f0',
    'text_dim': '#64748b',
    'primary': '#0ea5e9',      # sky-500 (포인트 색상)
    'secondary': '#94a3b8',    # slate-400
    'danger': '#f43f5e',       # rose-500
    'grid': '#334155',
}

# matplotlib 스타일 설정
plt.rcParams.update({
    'figure.facecolor': COLORS['bg'],
    'axes.facecolor': COLORS['bg'],
    'axes.edgecolor': COLORS['grid'],
    'axes.labelcolor': COLORS['text_dim'],
    'axes.titlecolor': COLORS['text'],
    'xtick.color': COLORS['text_dim'],
    'ytick.color': COLORS['text_dim'],
    'text.color': COLORS['text'],
    'axes.grid': False,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.spines.left': True,
    'axes.spines.bottom': True,
    'font.size': 10,
    'axes.titlesize': 13,
    'axes.labelsize': 10,
})

# 경로 설정
BASE_DIR = Path('/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/final/진짜최종')
DATA_DIR = BASE_DIR / 'result' / 'data'
OUTPUT_DIR = Path('/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/final/lifecycle/public/images/overview')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 50)
print("Overview 통계 시각화 (컨설팅 스타일)")
print("=" * 50)

# 데이터 로드
visit_df = pd.read_parquet(DATA_DIR / 'visit_level_data.parquet')
customer_df = pd.read_parquet(DATA_DIR / 'customer_summary.parquet')
print(f"데이터: {len(visit_df):,}건 방문 / {len(customer_df):,}명 고객")

CHURN_THRESHOLD = 25
RISK_THRESHOLD = 8


# ==========================================
# Chart 1: 방문 간격 히스토그램
# ==========================================
print("\n[1/5] 방문 간격 분포...")

fig, ax = plt.subplots(figsize=(10, 4.5))

intervals = visit_df['days_since_prev'].dropna()
p95 = intervals.quantile(0.95)

# 단색 히스토그램
n, bins, patches = ax.hist(
    intervals.clip(upper=50),
    bins=50,
    range=(0, 50),
    color=COLORS['secondary'],
    alpha=0.6,
    edgecolor='none'
)

# 25일 영역만 강조
for i, patch in enumerate(patches):
    if bins[i] >= CHURN_THRESHOLD:
        patch.set_facecolor(COLORS['danger'])
        patch.set_alpha(0.7)

# 임계값 라인
ax.axvline(x=CHURN_THRESHOLD, color=COLORS['danger'], linewidth=1.5, linestyle='-')

# 라벨
ax.text(CHURN_THRESHOLD + 1, ax.get_ylim()[1] * 0.85,
        f'이탈 기준\n25일+', fontsize=9, color=COLORS['danger'], va='top')

ax.text(p95, ax.get_ylim()[1] * 0.6, f'← 95% ({p95:.0f}일)',
        fontsize=8, color=COLORS['text_dim'], va='center')

ax.set_xlabel('방문 간격 (일)')
ax.set_ylabel('빈도')
ax.set_title('방문 간격 분포', fontweight='bold', loc='left', pad=10)
ax.set_xlim(0, 50)

# 우상단 통계
stats = f"N={len(intervals):,}  중앙값={intervals.median():.0f}일  95%ile={p95:.0f}일"
ax.text(0.98, 0.98, stats, transform=ax.transAxes, fontsize=8,
        ha='right', va='top', color=COLORS['text_dim'])

plt.tight_layout()
plt.savefig(OUTPUT_DIR / '01_interval_histogram.png', dpi=150,
            facecolor=COLORS['bg'], edgecolor='none', bbox_inches='tight')
plt.close()
print("  저장 완료")


# ==========================================
# Chart 2: 8일 기준 이탈 확률
# ==========================================
print("\n[2/5] 8일 기준 이탈 확률...")

fig, ax = plt.subplots(figsize=(6, 4.5))

# 계산
df_calc = visit_df.copy()
df_calc['next_is_churn'] = df_calc['days_since_prev'].shift(-1) >= CHURN_THRESHOLD
df_calc['group'] = (df_calc['days_since_prev'] >= RISK_THRESHOLD).map({False: '8일 미만', True: '8일 이상'})

result = df_calc.groupby('group', observed=True).agg(
    total=('next_is_churn', 'count'),
    churned=('next_is_churn', 'sum')
)
result['rate'] = (result['churned'] / result['total'] * 100)

# 순서 정렬
order = ['8일 미만', '8일 이상']
rates = [result.loc[o, 'rate'] for o in order]

# 막대 그래프 - 단색 계열
colors = [COLORS['secondary'], COLORS['danger']]
bars = ax.bar(order, rates, color=colors, width=0.5, edgecolor='none')

# 값 표시
for bar, rate in zip(bars, rates):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            f'{rate:.1f}%', ha='center', fontsize=11, fontweight='bold', color=COLORS['text'])

# 배수 표시
multiplier = rates[1] / rates[0]
mid_y = (rates[0] + rates[1]) / 2
ax.annotate('', xy=(1, rates[1] - 1), xytext=(0, rates[0] + 1),
            arrowprops=dict(arrowstyle='->', color=COLORS['primary'], lw=1.5))
ax.text(0.5, mid_y, f'×{multiplier:.1f}', ha='center', fontsize=12,
        fontweight='bold', color=COLORS['primary'])

ax.set_ylabel('이탈 확률 (%)')
ax.set_title('방문 간격별 이탈 확률', fontweight='bold', loc='left', pad=10)
ax.set_ylim(0, max(rates) * 1.25)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / '02_risk_threshold_8days.png', dpi=150,
            facecolor=COLORS['bg'], edgecolor='none', bbox_inches='tight')
plt.close()
print("  저장 완료")


# ==========================================
# Chart 3: VIP 정의
# ==========================================
print("\n[3/5] VIP 정의...")

fig, axes = plt.subplots(1, 2, figsize=(10, 4))

# 3-1. 이탈 경험 분포 (단순 막대)
ax = axes[0]
no_churn = (customer_df['churn_count'] == 0).sum()
has_churn = (customer_df['churn_count'] > 0).sum()
total = len(customer_df)

bars = ax.bar(['이탈 0회', '이탈 1회+'], [no_churn, has_churn],
              color=[COLORS['primary'], COLORS['secondary']], width=0.5, edgecolor='none')

for bar, val in zip(bars, [no_churn, has_churn]):
    pct = val / total * 100
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 20,
            f'{val:,}명\n({pct:.1f}%)', ha='center', fontsize=9, color=COLORS['text'])

ax.set_ylabel('고객 수')
ax.set_title('1단계: 이탈 경험', fontweight='bold', loc='left', pad=10)
ax.set_ylim(0, max(no_churn, has_churn) * 1.2)

# 3-2. 이탈 0회 고객 방문 분포
ax = axes[1]
no_churn_df = customer_df[customer_df['churn_count'] == 0]
vip_threshold = np.percentile(no_churn_df['visit_count'], 85)

n, bins, patches = ax.hist(no_churn_df['visit_count'], bins=25,
                           color=COLORS['secondary'], alpha=0.6, edgecolor='none')

# VIP 영역 강조
for i, patch in enumerate(patches):
    if bins[i] >= vip_threshold:
        patch.set_facecolor(COLORS['primary'])
        patch.set_alpha(0.8)

ax.axvline(x=vip_threshold, color=COLORS['primary'], linewidth=1.5)
ax.text(vip_threshold + 10, ax.get_ylim()[1] * 0.8,
        f'VIP 기준\n{vip_threshold:.0f}회+\n(상위 15%)',
        fontsize=9, color=COLORS['primary'], va='top')

ax.set_xlabel('방문 횟수')
ax.set_ylabel('고객 수')
ax.set_title(f'2단계: 이탈 0회 고객 분포 (N={no_churn:,})', fontweight='bold', loc='left', pad=10)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / '03_vip_definition.png', dpi=150,
            facecolor=COLORS['bg'], edgecolor='none', bbox_inches='tight')
plt.close()
print("  저장 완료")


# ==========================================
# Chart 4: 5등급 분류 결과
# ==========================================
print("\n[4/5] 5등급 분류...")

fig, ax = plt.subplots(figsize=(8, 4))

grade_counts = customer_df['final_grade'].value_counts()
grade_order = ['VIP', '충성', '활성', '위험', '이탈']

counts = [grade_counts.get(g, 0) for g in grade_order]
total = sum(counts)

# 수평 막대 - 그라데이션 효과 (밝은색 → 어두운색)
alphas = [1.0, 0.85, 0.7, 0.55, 0.4]
bars = ax.barh(grade_order, counts, color=COLORS['primary'], height=0.6, edgecolor='none')

for bar, alpha in zip(bars, alphas):
    bar.set_alpha(alpha)

# 값 표시
for i, (bar, count) in enumerate(zip(bars, counts)):
    pct = count / total * 100
    ax.text(bar.get_width() + 15, bar.get_y() + bar.get_height()/2,
            f'{count:,}명 ({pct:.1f}%)', va='center', fontsize=9, color=COLORS['text'])

ax.set_xlabel('고객 수')
ax.set_title('5등급 분류 결과', fontweight='bold', loc='left', pad=10)
ax.set_xlim(0, max(counts) * 1.25)
ax.invert_yaxis()

plt.tight_layout()
plt.savefig(OUTPUT_DIR / '04_grade_distribution.png', dpi=150,
            facecolor=COLORS['bg'], edgecolor='none', bbox_inches='tight')
plt.close()
print("  저장 완료")


# ==========================================
# Chart 5: 통계 검증 - 박스플롯
# ==========================================
print("\n[5/5] 통계적 검증...")

fig, axes = plt.subplots(1, 2, figsize=(10, 4))

grade_data = {g: customer_df[customer_df['final_grade'] == g] for g in grade_order}

# 5-1. 방문 횟수
ax = axes[0]
data = [grade_data[g]['visit_count'].values for g in grade_order]

bp = ax.boxplot(data, labels=grade_order, patch_artist=True, widths=0.6,
                medianprops=dict(color=COLORS['text'], linewidth=1.5),
                whiskerprops=dict(color=COLORS['text_dim'], linewidth=1),
                capprops=dict(color=COLORS['text_dim'], linewidth=1),
                flierprops=dict(marker='.', markerfacecolor=COLORS['text_dim'],
                               markersize=2, alpha=0.3, markeredgecolor='none'))

for i, (patch, alpha) in enumerate(zip(bp['boxes'], alphas)):
    patch.set_facecolor(COLORS['primary'])
    patch.set_alpha(alpha)
    patch.set_edgecolor('none')

# 평균 표시
for i, g in enumerate(grade_order):
    mean_val = grade_data[g]['visit_count'].mean()
    ax.text(i+1, mean_val, f'{mean_val:.0f}', ha='center', va='bottom',
            fontsize=8, color=COLORS['text'])

ax.set_ylabel('방문 횟수')
ax.set_title('등급별 방문 횟수', fontweight='bold', loc='left', pad=10)

# 5-2. 총 매출
ax = axes[1]
data = [grade_data[g]['total_sales'].values for g in grade_order]

bp = ax.boxplot(data, labels=grade_order, patch_artist=True, widths=0.6,
                medianprops=dict(color=COLORS['text'], linewidth=1.5),
                whiskerprops=dict(color=COLORS['text_dim'], linewidth=1),
                capprops=dict(color=COLORS['text_dim'], linewidth=1),
                flierprops=dict(marker='.', markerfacecolor=COLORS['text_dim'],
                               markersize=2, alpha=0.3, markeredgecolor='none'))

for i, (patch, alpha) in enumerate(zip(bp['boxes'], alphas)):
    patch.set_facecolor(COLORS['primary'])
    patch.set_alpha(alpha)
    patch.set_edgecolor('none')

for i, g in enumerate(grade_order):
    mean_val = grade_data[g]['total_sales'].mean()
    ax.text(i+1, mean_val, f'${mean_val:,.0f}', ha='center', va='bottom',
            fontsize=8, color=COLORS['text'])

ax.set_ylabel('총 매출 ($)')
ax.set_title('등급별 총 매출', fontweight='bold', loc='left', pad=10)

plt.tight_layout()
plt.savefig(OUTPUT_DIR / '05_statistical_validation.png', dpi=150,
            facecolor=COLORS['bg'], edgecolor='none', bbox_inches='tight')
plt.close()
print("  저장 완료")


# ==========================================
# 통계 검정
# ==========================================
from scipy import stats

print("\n" + "=" * 50)
print("통계 검정 결과")
print("=" * 50)

visit_by_grade = [grade_data[g]['visit_count'].values for g in grade_order]
h_stat, p_val = stats.kruskal(*visit_by_grade)
print(f"Kruskal-Wallis: H={h_stat:,.2f}, p<0.001")

print(f"\n완료: {OUTPUT_DIR}")
