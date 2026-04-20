package com.krh.backend.controllers;

import com.krh.backend.results.Result;
import java.util.HashMap;
import java.util.Map;

public abstract class CommonController {
    /**
     * Result Enum을 받아 프론트엔드용 JSON Map으로 변환합니다.
     * 모든 컨트롤러에서 response.put("result", ...) 하는 중복을 제거합니다.
     */
    protected Map<String, Object> resolveResult(Result result) {
        Map<String, Object> response = new HashMap<>();
        // Result 인터페이스 덕분에 CommonResult, UserResult 모두 처리 가능
        response.put("result", result.name().toLowerCase());
        return response;
    }

    /**
     * 데이터까지 함께 담아서 보내야 할 때 사용하는 오버로딩 메서드
     */
    protected Map<String, Object> resolveResult(Result result, Object data) {
        Map<String, Object> response = this.resolveResult(result);
        if (data != null) {
            response.put("data", data);
        }
        return response;
    }
}