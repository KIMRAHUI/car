package com.krh.backend.results;

/**
 * [결과 인터페이스 : 다형성을 위한 이름표]
 * 1. 프로젝트 내의 다양한 결과 Enum(CommonResult, UserResult 등)을 하나의 주머니에 담기 위한 공통 규격
 * 2. 이를 통해 서비스 메서드에서 '성공(CommonResult)'과 '상세 에러(UserResult)'를 하나의 리턴 타입(Result)으로 자유롭게 반환
 * 3. 향후 새로운 도메인(CarResult 등)이 추가되어도 시스템의 응답 구조를 일관되게 유지
 */
public interface Result {
    /**
     * 이 인터페이스를 구현하는 모든 객체(주로 Enum)가
     * 고유의 이름 문자열을 반환할 수 있도록 규격화합니다.
     * Enum은 기본적으로 이 메서드를 가지고 있으므로 별도 오버라이딩이 필요 없습니다.
     */
    String name();
}