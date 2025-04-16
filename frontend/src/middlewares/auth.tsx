import React, { useEffect, FC, useState } from "react";
import { Navigate } from "react-router-dom";

const Middleware: FC = ({ children }: { children?: React.ReactNode }) => {
    const [needLoginPage, setNeedLoginPage] = useState(false);

    useEffect(() => {
        if (!window.localStorage.getItem("authToken")) {
            setNeedLoginPage(true);
        } else {
            setNeedLoginPage(false);
        }
    }, []);

    return (
        <>
            {needLoginPage && <Navigate to="/login" />}
            {!needLoginPage && <>{children}</>}
        </>
    );
};

export default Middleware;
