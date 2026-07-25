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
                (request.getItems() != null && !request.getItems().isEmpty());
        /* || (request.getDescription() != null && !request.getDescription().isEmpty())
         */
    }
}