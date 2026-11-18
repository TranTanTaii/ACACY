(function () {
    "use strict";

    let currentIndex = -1;

    // ================================
    // Chỉ cho phép chạy trên trang hiện tại
    // ================================
    function isValidPage() {
        return document.querySelector("tr .guid-link") !== null;
    }

    // ================================
    // Lấy các dòng có ảnh
    // ================================
    function getRows() {
        return Array.from(
            document.querySelectorAll("tr")
        ).filter(row => row.querySelector(".guid-link"));
    }

    // ================================
    // Xác định dòng hiện tại
    // ================================
    function findCurrentIndex(rows) {

        // Ưu tiên active-row của website
        const activeRow = document.querySelector(
            "tr.active-row"
        );

        if (activeRow) {
            const index = rows.indexOf(activeRow);

            if (index !== -1) {
                currentIndex = index;
                return index;
            }
        }

        // Nếu website không có active-row
        // thì dùng vị trí đã lưu
        return currentIndex;
    }

    // ================================
    // Mở ảnh
    // ================================
    function openImage(index) {

        const rows = getRows();

        if (rows.length === 0) {
            return;
        }

        if (index < 0 || index >= rows.length) {
            return;
        }

        const row = rows[index];

        const guid = row.querySelector(
            ".guid-link"
        );

        if (!guid) {
            return;
        }

        // Chỉ click đúng phần tử website
        currentIndex = index;

        guid.click();
    }

    // ================================
    // Retrain
    // ================================
    function clickRetrain() {

        const button = document.querySelector(
            "button.btn-retrain"
        );

        if (!button) {
            return;
        }

        // Chỉ click khi button đang hiển thị
        if (button.offsetParent === null) {
            return;
        }

        button.click();
    }

    // ================================
    // Bắt phím
    // ================================
    document.addEventListener(
        "keydown",
        function (event) {

            // Không can thiệp nếu đang nhập
            const target = event.target;

            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target.isContentEditable
            ) {
                return;
            }

            // Không chạy nếu đang giữ Ctrl / Alt / Meta
            if (
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                return;
            }

            // Chỉ chạy trên trang có guid-link
            if (!isValidPage()) {
                return;
            }

            const key = event.key.toLowerCase();

            // ==========================
            // W
            // ==========================
            if (key === "w") {

                const rows = getRows();

                let current = findCurrentIndex(rows);

                // Nếu chưa biết ảnh hiện tại
                // thì không tự đoán
                if (current === -1) {
                    return;
                }

                // Chỉ ngăn hành vi mặc định
                // khi thực sự tìm được ảnh phía trên
                if (current > 0) {
                    event.preventDefault();
                    event.stopPropagation();

                    openImage(current - 1);
                }
            }

            // ==========================
            // S
            // ==========================
            else if (key === "s") {

                const rows = getRows();

                let current = findCurrentIndex(rows);

                if (current === -1) {
                    return;
                }

                if (current < rows.length - 1) {
                    event.preventDefault();
                    event.stopPropagation();

                    openImage(current + 1);
                }
            }

            // ==========================
            // R
            // ==========================
            else if (key === "r") {

                const button = document.querySelector(
                    "button.btn-retrain"
                );

                // Chỉ chặn R nếu thực sự có Retrain
                if (button && button.offsetParent !== null) {

                    event.preventDefault();
                    event.stopPropagation();

                    clickRetrain();
                }
            }

        },
        false
    );

})();