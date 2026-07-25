package com.krh.backend.controllers.mypage;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.dtos.MaintenanceResponse;
import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.user.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageController extends CommonController {

    private final UserService userService;

    //WebConfig와 동일한 경로를 사용하기 위해 설정값 가져옴
    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 마이페이지 회원 정보 조회
     * 소셜 로그인(OAuth2) 응답 구조와 동일하게 'Flat(평면)' 구조로 변경,
     * 프론트엔드에서 별도의 주머니(user)를 거치지 않고 바로 데이터를 읽을 수 있게 함
     */
    @GetMapping(value = "/info", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getMyInfo(HttpSession session) {

        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");

        if (sessionUser == null) {
            Map<String, Object> failureResponse = new HashMap<>();
            failureResponse.put("isLoggedIn", false);
            return failureResponse;
        }

        // DB 최신 정보 조회
        UserEntity user = this.userService.getUserByEmail(sessionUser.getEmail());

        //"user" 키 안에 객체를 넣지 않고, 필드들을 최상위(Root)에 바로 담음
        Map<String, Object> response = new HashMap<>();
        response.put("result", "success");
        response.put("isLoggedIn", true);
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("phone", user.getPhone());
        response.put("carNumber", user.getCarNumber());
        response.put("brandName", user.getBrandName());
        response.put("modelName", user.getModelName());
        response.put("fuelType", user.getFuelType());
        response.put("mileage", user.getMileage());
        response.put("annualMileage", user.getAnnualMileage());
        response.put("drivingEnv", user.getDrivingEnv());
        response.put("profileImage", user.getProfileImage());
        response.put("createdAt", user.getCreatedAt());

        return response;
    }

    /**
     *  다음 점검 및 교체 현황 조회
     * - UserService에서 계산된 소모품별 교체 주기 데이터를 리스트로 반환
     */
    @GetMapping(value = "/maintenance", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getMaintenanceStatus(HttpSession session) {
        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");

        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // 서비스 호출을 통해 계산된 리스트 가져오기
        List<MaintenanceResponse> maintenanceList = this.userService.getMaintenanceStatus(sessionUser.getEmail());

        Map<String, Object> response = this.resolveResult(CommonResult.SUCCESS);
        response.put("maintenance", maintenanceList);

        return response;
    }

    /**
     * 회원 정보 수정
     * currentPassword가 있으면: 기존의 철저한 '통합 개인정보 수정' (이메일, 비밀번호 인증 필수)
     * currentPassword가 없으면: 사진 클릭을 통한 '프로필 이미지 즉시 변경' (비밀번호 인증 건너뜜)
     */
    @PostMapping(value = "/update", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> postUpdate(@RequestParam("email") String email,
                                          @RequestParam(value = "password", required = false) String password,
                                          @RequestParam(value = "currentPassword", required = false) String currentPassword,
                                          @RequestParam(value = "profileImage", required = false) MultipartFile file,
                                          HttpSession session) {

        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");
        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        UserEntity currentUser = this.userService.getUserByEmail(sessionUser.getEmail());

        // 파일 업로드 처리
        if (file != null && !file.isEmpty()) {
            try {
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();

                //System.getProperty 대신 설정된 uploadDir을 사용하고 슬래시 처리
                String basePath = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
                String uploadPath = basePath + "profile/";

                File folder = new File(uploadPath);
                if (!folder.exists()) {
                    folder.mkdirs();
                }

                file.transferTo(new File(uploadPath + fileName));

                // DB에 저장할 웹 접근 경로 설정 (WebConfig의 /upload/profile/** 매핑과 일치)
                currentUser.setProfileImage("/upload/profile/" + fileName);

            } catch (IOException e) {
                e.printStackTrace();
                return this.resolveResult(CommonResult.FAILURE);
            }
        }


        // 현재 비밀번호(currentPassword)가 넘어오지 않은 경우는 '이미지만 즉시 변경'하는 상황
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            Result imageUpdateResult = this.userService.updateProfileImageOnly(currentUser);
            if (imageUpdateResult == CommonResult.SUCCESS) {
                session.setAttribute("sessionUser", currentUser);

                Map<String, Object> successResponse = new HashMap<>();
                successResponse.put("result", "success");
                // 프론트엔드에서 즉시 변경가능하게 새 경로를 던져줌
                successResponse.put("profileImage", currentUser.getProfileImage());

                return successResponse;
            } else {
                return this.resolveResult(CommonResult.FAILURE);
            }
        }

        // 프론트에서 보낸 '새 비밀번호'와 '새 이메일' 설정
        currentUser.setPassword(password);
        currentUser.setEmail(email);

        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(currentUser, currentPassword);

        if (pair.getLeft() == CommonResult.SUCCESS) {
            session.setAttribute("sessionUser", pair.getRight());
        }

        return this.resolveResult(pair.getLeft());
    }

    /* 회원 탈퇴*/
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

    /**
     * 정비 기록 수동 업데이트
     * 프론트엔드 MyPage의 '정비 기록 입력' 탭에서 보낸 데이터를 처리
     */
    @PostMapping(value = "/maintenance/update", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> postMaintenanceUpdate(@RequestBody Map<String, Object> payload, HttpSession session) {
        UserEntity sessionUser = (UserEntity) session.getAttribute("sessionUser");
        //세션 확인
        if (sessionUser == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }

        // payload에서 데이터 추출
        String email = (String) payload.get("email");
        String itemName = (String) payload.get("itemName");
        String lastServiceDate = (String) payload.get("lastServiceDate");

        Object mileageObj = payload.get("lastServiceMileage");
        int lastServiceMileage = (mileageObj != null && !mileageObj.toString().isEmpty())
                ? Integer.parseInt(mileageObj.toString())
                : 0;

        Result result = this.userService.updateUserMaintenanceRecord(email, itemName, lastServiceDate, lastServiceMileage);

        return this.resolveResult(result);
    }
}