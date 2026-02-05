#!/usr/bin/env python3
"""
Attention-LSTM 모델 학습 스크립트
고객 상태 시퀀스로 다음 상태 예측

Usage:
    pip install torch numpy onnx
    python scripts/train_model.py
"""

import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from pathlib import Path

# 상태 매핑
STATE_TO_IDX = {
    'waiting': 0,
    'active': 0,  # waiting과 동일 취급
    'loyal_candidate': 1,
    'loyal': 1,
    'vip_candidate': 2,
    'vip': 2,
    'risk': 3,
    'churn': 4,
}

IDX_TO_STATE = {
    0: 'active',
    1: 'loyal',
    2: 'vip',
    3: 'risk',
    4: 'churn',
}

NUM_STATES = 5
SEQUENCE_LENGTH = 6  # 6개월 시퀀스
HIDDEN_SIZE = 32
NUM_LAYERS = 2
BATCH_SIZE = 64
EPOCHS = 100
LEARNING_RATE = 0.001


class AttentionLSTM(nn.Module):
    """Attention 메커니즘이 포함된 LSTM 모델"""

    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super(AttentionLSTM, self).__init__()

        # Embedding layer for state indices
        self.embedding = nn.Embedding(input_size, hidden_size)

        # LSTM layer
        self.lstm = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )

        # Attention layer
        self.attention = nn.Linear(hidden_size, 1)

        # Output layer
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        # x shape: (batch, seq_len)

        # Embedding
        embedded = self.embedding(x)  # (batch, seq_len, hidden_size)

        # LSTM
        lstm_out, _ = self.lstm(embedded)  # (batch, seq_len, hidden_size)

        # Attention weights
        attention_weights = torch.softmax(
            self.attention(lstm_out).squeeze(-1), dim=1
        )  # (batch, seq_len)

        # Weighted sum
        context = torch.bmm(
            attention_weights.unsqueeze(1), lstm_out
        ).squeeze(1)  # (batch, hidden_size)

        # Output
        output = self.fc(context)  # (batch, num_classes)

        return output, attention_weights


def load_data(data_path):
    """데이터 로드 및 시퀀스 추출"""
    with open(data_path, 'r') as f:
        data = json.load(f)

    sequences = []
    labels = []

    for customer in data['customers']:
        state_changes = customer['stateChanges']

        if len(state_changes) < 2:
            continue

        # 월별 상태 추출 (30일 단위)
        max_day = state_changes[-1]['day']
        monthly_states = []

        for month in range(0, max_day + 30, 30):
            # 해당 월의 상태 찾기
            current_state = 'waiting'
            for change in state_changes:
                if change['day'] <= month:
                    current_state = change['state']
                else:
                    break
            monthly_states.append(STATE_TO_IDX.get(current_state, 0))

        # 시퀀스 생성 (6개월 -> 다음 상태)
        for i in range(len(monthly_states) - SEQUENCE_LENGTH):
            seq = monthly_states[i:i + SEQUENCE_LENGTH]
            label = monthly_states[i + SEQUENCE_LENGTH]
            sequences.append(seq)
            labels.append(label)

    return np.array(sequences), np.array(labels)


def train_model(X, y):
    """모델 학습"""
    # Train/test split
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # Convert to tensors
    X_train = torch.LongTensor(X_train)
    y_train = torch.LongTensor(y_train)
    X_test = torch.LongTensor(X_test)
    y_test = torch.LongTensor(y_test)

    # DataLoader
    train_dataset = TensorDataset(X_train, y_train)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)

    # Model
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Using device: {device}")

    model = AttentionLSTM(
        input_size=NUM_STATES,
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS,
        num_classes=NUM_STATES
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Training loop
    print("\n학습 시작...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0

        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)

            optimizer.zero_grad()
            outputs, _ = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        if (epoch + 1) % 10 == 0:
            # Evaluate
            model.eval()
            with torch.no_grad():
                X_test_dev = X_test.to(device)
                y_test_dev = y_test.to(device)
                test_outputs, _ = model(X_test_dev)
                _, predicted = torch.max(test_outputs, 1)
                accuracy = (predicted == y_test_dev).float().mean().item()

            print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {total_loss/len(train_loader):.4f}, Test Acc: {accuracy:.4f}")

    return model, device


def export_to_onnx(model, device, output_path):
    """ONNX 형식으로 내보내기 (단일 파일, dynamo 비활성화)"""
    import os
    model.eval()
    model_cpu = model.cpu()

    # Dummy input (CPU)
    dummy_input = torch.LongTensor([[0, 1, 2, 3, 4, 0]])

    # 기존 파일 삭제
    if os.path.exists(output_path):
        os.remove(output_path)
    data_file = output_path + '.data'
    if os.path.exists(data_file):
        os.remove(data_file)

    # Export - dynamo=False로 레거시 방식 사용 (단일 파일 생성)
    torch.onnx.export(
        model_cpu,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['sequence'],
        output_names=['prediction', 'attention'],
        dynamo=False,  # 레거시 방식 사용
    )

    print(f"\nONNX 모델 저장됨: {output_path}")

    # 외부 데이터 파일이 생성되었는지 확인
    if os.path.exists(data_file):
        print(f"⚠️ 외부 데이터 파일 생성됨: {data_file}")
    else:
        print("✅ 단일 파일로 저장됨 (외부 데이터 없음)")


def save_metadata(output_path):
    """모델 메타데이터 저장"""
    metadata = {
        'state_to_idx': STATE_TO_IDX,
        'idx_to_state': IDX_TO_STATE,
        'num_states': NUM_STATES,
        'sequence_length': SEQUENCE_LENGTH,
        'states': ['active', 'loyal', 'vip', 'risk', 'churn'],
        'state_labels_ko': ['활성', '충성', 'VIP', '위험', '이탈'],
    }

    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"메타데이터 저장됨: {output_path}")


def main():
    # Paths
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    data_path = project_dir / 'src/lib/data/racing-data-v2.json'
    model_dir = project_dir / 'public/model'
    model_dir.mkdir(exist_ok=True)

    print("=" * 50)
    print("Attention-LSTM 고객 상태 예측 모델 학습")
    print("=" * 50)

    # Load data
    print("\n데이터 로딩 중...")
    X, y = load_data(data_path)
    print(f"총 시퀀스 수: {len(X)}")
    print(f"시퀀스 형태: {X.shape}")

    # 클래스 분포 확인
    unique, counts = np.unique(y, return_counts=True)
    print("\n클래스 분포:")
    for idx, count in zip(unique, counts):
        print(f"  {IDX_TO_STATE[idx]}: {count} ({count/len(y)*100:.1f}%)")

    # Train
    model, device = train_model(X, y)

    # Export to ONNX
    onnx_path = model_dir / 'customer_predictor.onnx'
    export_to_onnx(model, device, str(onnx_path))

    # Save metadata
    metadata_path = model_dir / 'model_metadata.json'
    save_metadata(str(metadata_path))

    print("\n" + "=" * 50)
    print("완료!")
    print(f"모델: {onnx_path}")
    print(f"메타데이터: {metadata_path}")
    print("=" * 50)


if __name__ == '__main__':
    main()
