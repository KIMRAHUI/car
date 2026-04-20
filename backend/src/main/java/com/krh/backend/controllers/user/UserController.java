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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.util.HashMap;
import java.util.List;
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
        Result result = this.userService.sendVerificationEmail(email, type);
        return this.resolveResult(result);
    }

    /**
     * POST 이메일 인증번호 확인
     */
    @RequestMapping(value = "/verify-email", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postVerifyEmail(@RequestParam("email") String email,
                                               @RequestParam("code") String code) {
        Result result = this.userService.verifyEmailCode(email, code);
        return this.resolveResult(result);
    }

    /**
     * POST 임시 비밀번호 발급 (차량 번호 검증 추가)
     */
    @RequestMapping(value = "/temp-password", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postTempPassword(@RequestParam("email") String email,
                                                @RequestParam("carNumber") String carNumber) {
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
        session.invalidate();
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
            map.put("carModelId", user.getCarModelId());
            map.put("carNumber", user.getCarNumber());
        }
        return map;
    }

    /**
     * POST 개인정보 및 비밀번호 수정
     */
    @RequestMapping(value = "/update-info", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postUpdateInfo(UserEntity user,
                                              @RequestParam("currentPassword") String currentPassword) {
        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(user, currentPassword);
        return this.resolveResult(pair.getLeft());
    }

    /**
     * DELETE 회원 탈퇴 처리
     */
    @RequestMapping(value = "/withdraw", method = RequestMethod.DELETE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> deleteWithdraw(HttpSession session) {
        UserEntity user = (UserEntity) session.getAttribute("sessionUser");

        if (user == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        Result result = this.userService.deleteUser(user.getEmail());

        if (result == CommonResult.SUCCESS) {
            session.invalidate();
        }

        return this.resolveResult(result);
    }


    // [차량 마스터 정보 및 전용 수정 API]

    /**
     * GET 모든 차량 브랜드 목록 조회
     * 모달 Step 1에서 사용
     */
    @RequestMapping(value = "/car-brands", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public List<Map<String, Object>> getCarBrands() {
        return this.userService.getAllBrands();
    }

    /**
     * GET 브랜드별 모델 목록 조회
     * 모달 Step 2에서 사용
     */
    @RequestMapping(value = "/car-models", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public List<Map<String, Object>> getCarModels(@RequestParam("brandId") int brandId) {
        return this.userService.getModelsByBrand(brandId);
    }

    /**
     * POST 차량 정보만 수정 (마이페이지 차량 수정 모달 전용)
     * @param carModelId 사용자가 선택한 검증된 모델 ID
     * @param carNumber 사용자가 입력한 차량 번호
     */
    @RequestMapping(value = "/update-vehicle", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postUpdateVehicle(@RequestParam("carModelId") int carModelId,
                                                 @RequestParam("carNumber") String carNumber,
                                                 HttpSession session) {
        UserEntity user = (UserEntity) session.getAttribute("sessionUser");
        if (user == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // 서비스에서 모델 ID 유효성 검증 후 업데이트 수행
        Result result = this.userService.updateVehicleOnly(user.getEmail(), carModelId, carNumber);

        // 성공 시 세션 정보 동기화 (화면 즉시 반영 위함)
        if (result == CommonResult.SUCCESS) {
            user.setCarModelId(carModelId);
            user.setCarNumber(carNumber);
            session.setAttribute("sessionUser", user);
        }

        return this.resolveResult(result);
    }
}