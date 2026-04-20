package com.krh.backend.controllers.mypage;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.user.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/mypage")
public class MyPageController extends CommonController {

    private final UserService userService;

    /**
     * 마이페이지 회원 정보 조회
     * [수정] resolveResult를 사용하여 { "result": "success" } 소문자 포맷으로 통일
     */
    @GetMapping(value = "/info", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getMyInfo(HttpSession session) {

        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");

        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // DB 최신 정보 조회
        UserEntity user = this.userService.getUserByEmail(sessionUser.getEmail());

        // CommonController의 로직을 사용하여 결과 생성 후 user 객체 추가
        Map<String, Object> response = this.resolveResult(CommonResult.SUCCESS);
        response.put("user", user);

        return response;
    }

    /**
     * 회원 정보 수정
     */
    @PostMapping(value = "/update", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> postUpdate(UserEntity user, HttpSession session) {

        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");

        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // 보안: 세션 이메일 강제 적용 (타인 정보 수정 방지)
        user.setEmail(sessionUser.getEmail());

        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(user);

        if (pair.getLeft() == CommonResult.SUCCESS) {
            session.setAttribute("sessionUser", pair.getRight());
        }

        return this.resolveResult(pair.getLeft());
    }

    /**
     * 회원 탈퇴
     */
    @PostMapping(value = "/delete", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> postDelete(HttpSession session) {

        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");

        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        Result result = this.userService.deleteUser(sessionUser.getEmail());

        if (result == CommonResult.SUCCESS) {
            session.invalidate();
        }

        return this.resolveResult(result);
    }
}