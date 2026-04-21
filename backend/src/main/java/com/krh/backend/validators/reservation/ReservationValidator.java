package com.krh.backend.validators.reservation;

import com.krh.backend.dtos.service.ReservationRequest;
import com.krh.backend.validators.ValidatorUtils;
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
                // 수리 항목이나 설명 둘 중 하나는 반드시 존재해야 함
                ((request.getItems() != null && !request.getItems().isEmpty()) ||
                        (request.getDescription() != null && !request.getDescription().isEmpty()));
    }
}