package com.krh.backend.controllers.user;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.user.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController extends CommonController {
    private final UserService userService;

    /**
     * POST 이메일 인증번호 발송
     * @param email 수신 이메일
     * @param type 요청 타입 (JOIN, FIND_PASSWORD 등)
     */
    @RequestMapping(value = "/email", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postEmail(@RequestParam("email") String email,
                                         @RequestParam("type") String type) {
        // UserService의 인증 메일 발송 로직 호출
        Result result = this.userService.sendVerificationEmail(email, type);

        // resolveResult를 통해 응답 규격(SUCCESS, FAILURE 등)에 맞춰 JSON 반환
        return this.resolveResult(result);
    }

    /**
     * POST 이메일 인증번호 확인
     * @param email 수신 이메일
     * @param code 사용자가 입력한 6자리 인증번호
     * @return 성공 시 SUCCESS, 만료 시 INVALID_EMAIL, 불일치 시 WRONG_PASSWORD 등
     */
    @RequestMapping(value = "/verify-email", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postVerifyEmail(@RequestParam("email") String email,
                                               @RequestParam("code") String code) {
        // UserService에 추가된 확인 로직 호출
        Result result = this.userService.verifyEmailCode(email, code);

        return this.resolveResult(result);
    }

    /**
     * POST 임시 비밀번호 발급 (차량 번호 검증 추가)
     * @param email 수신 이메일
     * @param carNumber 사용자가 입력한 차량 번호
     * @return 성공 시 SUCCESS, 유저 없음 시 USER_NOT_FOUND, 정보 불일치 시 FAILURE 등
     */
    @RequestMapping(value = "/temp-password", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postTempPassword(@RequestParam("email") String email,
                                                @RequestParam("carNumber") String carNumber) {
        // 보완된 UserService의 임시 비밀번호 발급 로직 호출 (차량 번호 포함)
        Result result = this.userService.issueTemporaryPassword(email, carNumber);

        return this.resolveResult(result);
    }

    /**
     * GET 로그인 페이지 이동
     */
    @RequestMapping(value = "/login", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
    public ModelAndView getLogin(ModelAndView modelAndView) {
        modelAndView.setViewName("user/login");
        return modelAndView;
    }

    /**
     * GET 회원가입 페이지 이동
     */
    @RequestMapping(value = "/register", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
    public ModelAndView getRegister(ModelAndView modelAndView) {
        modelAndView.setViewName("user/register");
        return modelAndView;
    }

    /**
     * POST 로그인 처리 (JSON 응답)
     */
    @RequestMapping(value = "/login", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postLogin(UserEntity user, HttpSession session) {
        Pair<Result, UserEntity> pair = this.userService.login(user.getEmail(), user.getPassword());

        if (pair.getLeft() == CommonResult.SUCCESS) {
            session.setAttribute("sessionUser", pair.getRight());
        }

        return this.resolveResult(pair.getLeft());
    }

    /**
     * POST 회원가입 처리 (JSON 응답)
     */
    @RequestMapping(value = "/register", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postRegister(UserEntity user, HttpSession session) {
        String socialType = (String) session.getAttribute("pendingSocialType");
        String socialId = (String) session.getAttribute("pendingSocialId");

        if (socialType != null && socialId != null) {
            user.setSocialTypeCode(socialType);
            user.setSocialId(socialId);
        }

        Pair<Result, UserEntity> pair = this.userService.register(user);

        if (pair.getLeft() == CommonResult.SUCCESS) {
            session.removeAttribute("pendingSocialType");
            session.removeAttribute("pendingSocialId");
        }

        return this.resolveResult(pair.getLeft());
    }

    /**
     * GET 로그아웃
     */
    @RequestMapping(value = "/logout", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
    public ModelAndView getLogout(ModelAndView modelAndView, HttpSession session) {
        session.invalidate(); // 세션 무효화
        modelAndView.setViewName("redirect:/");
        return modelAndView;
    }

    /**
     * 로그인 상태 확인
     */
    @RequestMapping(value = "/status", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> getStatus(HttpSession session) {
        UserEntity user = (UserEntity) session.getAttribute("sessionUser");
        Map<String, Object> map = new HashMap<>();

        if (user == null) {
            map.put("isLoggedIn", false);
        } else {
            map.put("isLoggedIn", true);
            map.put("name", user.getName());
            map.put("email", user.getEmail());
        }
        return map;
    }

    /**
     * POST 개인정보 및 비밀번호 수정
     * 프론트엔드에서 보낸 currentPassword를 함께 받아 서비스에 전달
     */
    @RequestMapping(value = "/update-info", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postUpdateInfo(UserEntity user,
                                              @RequestParam("currentPassword") String currentPassword) {
        // 보완된 UserService의 updateUserInfo 메서드를 호출합니다.
        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(user, currentPassword);

        // 결과를 응답 규격에 맞춰 반환합니다.
        return this.resolveResult(pair.getLeft());
    }

    /**
     * DELETE 회원 탈퇴 처리
     * URL: /user/withdraw
     */
    @RequestMapping(value = "/withdraw", method = RequestMethod.DELETE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> deleteWithdraw(HttpSession session) {
        // 1. 세션에서 현재 로그인된 유저 정보 가져오기
        UserEntity user = (UserEntity) session.getAttribute("sessionUser");

        // 2. 미로그인 상태 체크
        if (user == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // 3. 서비스의 deleteUser 호출 (DB 삭제 수행)
        Result result = this.userService.deleteUser(user.getEmail());

        // 4. 삭제 성공 시 세션 무효화 (로그아웃 효과)
        if (result == CommonResult.SUCCESS) {
            session.invalidate();
        }

        return this.resolveResult(result);
    }


}