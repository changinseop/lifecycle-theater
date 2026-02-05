#!/usr/bin/env python3
"""
ONNX 모델에서 외부 데이터 참조를 제거하고 단일 파일로 저장
"""

import onnx
from onnx.external_data_helper import convert_model_to_external_data
from pathlib import Path
import numpy as np

def fix_model():
    model_path = Path(__file__).parent.parent / 'public/model/customer_predictor.onnx'
    output_path = model_path  # 같은 위치에 덮어쓰기

    print(f"모델 로드: {model_path}")
    model = onnx.load(str(model_path))

    # 모든 외부 데이터를 모델 내부로 이동
    for tensor in model.graph.initializer:
        if tensor.HasField('data_location') and tensor.data_location == onnx.TensorProto.EXTERNAL:
            # 외부 데이터 참조 제거
            tensor.ClearField('data_location')

    # 모델을 단일 파일로 저장 (size_threshold를 크게 설정)
    onnx.save(
        model,
        str(output_path),
        save_as_external_data=False,
    )

    print(f"수정된 모델 저장: {output_path}")

    # 검증
    model_check = onnx.load(str(output_path))
    onnx.checker.check_model(model_check)
    print("모델 검증 완료!")

if __name__ == '__main__':
    fix_model()
