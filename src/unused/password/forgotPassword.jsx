import React, { useState } from 'react';
import axios from "axios"; ///Akses APi express
import { useNavigate } from "react-router-dom"

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setconfPassword] = useState('');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();
    const Register = async(e) => {
        e.preventDefault();
        try {
            await axios.post('/updateUsers', {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            });
            navigate("/");
        } catch (error) {
            if(error.response){
                setMsg(error.response.data.msg)
            }
        }
    }

    return (
        <>
        <html class="flex items-center justify-center min-h-screen bg-slate-900">
            <body class="h-full">
                <div className="flex  bg-slate-100 min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-16 rounded-lg">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <img
                            className="mx-auto h-10 w-auto"
                            src="https://smb-padiumkm-images-public-prod.oss-ap-southeast-5.aliyuncs.com/product/image/16072024/631a5d9c8755a8a9896096bd/66960719842eadd24efe4127/5becd2979128a4d24ef6e83a66af09.jpeg?x-oss-process=image/resize,m_pad,w_432,h_432/quality,Q_70"
                            alt="Your Company"
                        />
                        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                            Forgot Password
                        </h2>
                        <p className='mt-5 text-center text-2l leading-9 tracking-tight text-red-500'>{msg}</p>
                    </div>

                    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={Register} className="space-y-6" action="#" method="POST">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full rounded-md border-0 px-2 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                        New Password
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full rounded-md border-0 px-2 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                        Re-Type New Password
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full rounded-md border-0 px-2 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        value={confirmPassword} onChange={(e) => setconfPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <a href="/Login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                                Sign In
                            </a>
                        </p>
                    </div>
                </div>
            </body>
        </html>
    </>
)
}

export default ForgotPassword

