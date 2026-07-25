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
     * UX 개선을 위해 발송 횟수(retryCount)가 포함된 서비스 메서드를 호출
     *
     * @param email 수신 이메일
     * @param type  요청 타입 (JOIN, FIND_PASSWORD 등)
     */
    @RequestMapping(value = "/email", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postEmail(@RequestParam("email") String email,
                                         @RequestParam("type") String type) {
        // 기존의 Result 리턴 대신, retryCount가 포함된 Map을 리턴하는 메서드 호출
        return this.userService.sendVerificationEmailWithCount(email, type);
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
     * 프론트엔드 전송 방식에 맞춰 @RequestParam으로 파라미터를 명시,
     * 성공 시 세션 생성 및 프론트엔드 'isLoggedIn' 체크 로직과 호환되도록 응답을 구성
     */
    @RequestMapping(value = "/login", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postLogin(@RequestParam("email") String email,
                                         @RequestParam("password") String password,
                                         HttpSession session) {
        // 이메일과 비밀번호로 로그인 검증 수행
        Pair<Result, UserEntity> pair = this.userService.login(email, password);

        if (pair.getLeft() == CommonResult.SUCCESS) {
            //세션에 "sessionUser"라는 이름으로 DB에서 조회된 완전한 유저 엔티티를 저장
            session.setAttribute("sessionUser", pair.getRight());

            // 프론트엔드 ae() 함수의 t.isLoggedIn === !0 체크에 대응하기 위해 값 추가
            Map<String, Object> response = this.resolveResult(CommonResult.SUCCESS);
            response.put("isLoggedIn", true);
            return response;
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


        if (socialType != null && socialId != null && (user.getPassword() == null || user.getPassword().isEmpty())) {
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
            map.put("phone", user.getPhone());
            map.put("brandName", user.getBrandName());
            map.put("modelName", user.getModelName());
            map.put("mileage", user.getMileage());
            map.put("profileImage", user.getProfileImage());
        }
        return map;
    }

    /**
     * POST 개인정보 및 비밀번호 수정 (비밀번호 검증 선택적 허용)
     */
    @RequestMapping(value = "/update-info", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postUpdateInfo(UserEntity user,
                                              @RequestParam(value = "currentPassword", required = false) String currentPassword,
                                              HttpSession session) {
        // 서비스 호출 (비밀번호가 null이면 사진/정보만 수정하도록 서비스 로직에서 처리됨)
        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(user, currentPassword);

        // 정보 수정(이미지 포함) 성공 시 세션 갱신
        if (pair.getLeft() == CommonResult.SUCCESS) {
            // DB에서 JOIN된 최신 정보(새 이미지 경로/모델명 포함)를 다시 가져옴
            UserEntity newUser = this.userService.getUserByEmail(user.getEmail());
            if (newUser != null) {
                newUser.setPassword(null); // 보안상 비밀번호는 제거
                session.setAttribute("sessionUser", newUser); // 세션 동기화
            }
        }

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

    @RequestMapping(value = "/update-vehicle", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postUpdateVehicle(@RequestParam("carModelId") int carModelId,
                                                 @RequestParam("carNumber") String carNumber,
                                                 HttpSession session) {
        UserEntity user = (UserEntity) session.getAttribute("sessionUser");
        if (user == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // 1. 서비스에서 DB 업데이트 수행 (이 시점에 DB의 users 테이블은 변경)
        Result result = this.userService.updateVehicleOnly(user.getEmail(), carModelId, carNumber);

        // 2. 성공 시 세션 정보 동기화
        if (result == CommonResult.SUCCESS) {
            UserEntity newUser = this.userService.getUserByEmail(user.getEmail());

            if (newUser != null) {
                newUser.setPassword(null);
                session.setAttribute("sessionUser", newUser); // 세션에 덮어쓰기
            }
        }

        return this.resolveResult(result);
    }
}