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
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/mypage")
public class MyPageController extends CommonController {

    private final UserService userService;

    /**
     * 마이페이지 회원 정보 조회
     * resolveResult를 사용하여 { "result": "success" } 소문자 포맷으로 통일
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
     * [추가] 다음 점검 및 교체 현황 조회
     * - UserService에서 계산된 소모품별 교체 주기 데이터를 리스트로 반환합니다.
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
     * [비상구 로직 설계]
     * 1. currentPassword가 있으면: 기존의 철저한 '통합 개인정보 수정' (이메일, 비밀번호 인증 필수)
     * 2. currentPassword가 없으면: 사진 클릭을 통한 '프로필 이미지 즉시 변경' (비밀번호 인증 건너뜀)
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

        // 1. DB에서 최신 정보를 먼저 가져옴
        UserEntity currentUser = this.userService.getUserByEmail(sessionUser.getEmail());

        // 2. 파일 업로드 처리 (즉시 변경이든 통합 수정이든 파일이 있으면 공통 실행)
        if (file != null && !file.isEmpty()) {
            try {
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                String uploadPath = "C:/Users/노오리/Desktop/carmit_uploads/profile/";

                File folder = new File(uploadPath);
                if (!folder.exists()) {
                    folder.mkdirs();
                }

                file.transferTo(new File(uploadPath + fileName));

                // DB에 저장할 웹 접근 경로 설정
                currentUser.setProfileImage("/upload/profile/" + fileName);

            } catch (IOException e) {
                e.printStackTrace();
                return this.resolveResult(CommonResult.FAILURE);
            }
        }

        // [핵심 비상구 분기]
        // 현재 비밀번호(currentPassword)가 넘어오지 않은 경우는 '이미지만 즉시 변경'하는 상황임
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            // 비밀번호 검증 없이 이미지 경로만 업데이트하도록 기존 서비스 로직 대신 개별 업데이트 로직 태움
            Result imageUpdateResult = this.userService.updateProfileImageOnly(currentUser);
            if (imageUpdateResult == CommonResult.SUCCESS) {
                session.setAttribute("sessionUser", currentUser);
                return this.resolveResult(CommonResult.SUCCESS);
            } else {
                return this.resolveResult(CommonResult.FAILURE);
            }
        }

        // 3. 통합 수정 모드: 프론트에서 보낸 '새 비밀번호'와 '새 이메일' 설정
        currentUser.setPassword(password);
        currentUser.setEmail(email);

        // 4. 서비스 호출 (기존 비밀번호 검증 절차 포함)
        Pair<Result, UserEntity> pair = this.userService.updateUserInfo(currentUser, currentPassword);

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