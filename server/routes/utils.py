from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from deep_translator import GoogleTranslator

utils_bp = Blueprint('utils', __name__)

@utils_bp.route('/translate', methods=['POST'])
@jwt_required()
def translate_text():
    """翻译文字 (中文 -> 英文)"""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'translatedText': ''})
    
    try:
        # 使用 deep-translator 进行翻译
        translated = GoogleTranslator(source='zh-CN', target='en').translate(text)
        return jsonify({'translatedText': translated})
    except Exception as e:
        print(f"翻译出错: {str(e)}")
        return jsonify({'error': '翻译失败', 'details': str(e)}), 500
