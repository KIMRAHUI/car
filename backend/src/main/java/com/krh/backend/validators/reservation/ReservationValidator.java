package com.krh.backend.validators.reservation;

import com.krh.backend.dtos.ReservationRequest;
import lombok.experimental.UtilityClass;

@UtilityClass
public class ReservationValidator {

    public static boolean validateRequest(ReservationRequest request) {
        return request != null &&
                request.getUserEmail() != null &&
                request.getPartnerId() != null &&
                !request.getPartnerId().isEmpty() &&
                request.getCategory() != null &&
                request.getSelectedDate() != null &&
                request.getSelectedTime() != null &&
                // [수정] description 속성을 제거했으므로, 이제 선택된 수리 항목(Items)은 반드시 존재해야 함
                (request.getItems() != null && !request.getItems().isEmpty());
        /* || (request.getDescription() != null && !request.getDescription().isEmpty())
         */
    }
}