import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import WebFont from "webfontloader";
import Navbar from '../containers/nav/NavbarUser';
import API from "../api/Api";

const Profile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [image, setImage] = useState('');

  useEffect(() => {
    refreshToken();
    const savedImage = localStorage.getItem('savedImage');
    if (savedImage) {
      setImage(savedImage);
    };
    WebFont.load({
      google: {
        families: ["sans-serif", "Poppins"],
      },
    });

  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setImage(src);
    }
  };

  const handleSaveImage = () => {
    localStorage.setItem('savedImage', image);
    alert('Gambar telah disimpan!');
  };
  
const refreshToken = async () => {
  try {
    const response = await API.get("/token");
    setToken(response.data.accessToken);
    const decoded = jwtDecode(response.data.accessToken);
    setExpire(decoded.exp);

    // setelah dapat token, panggil endpoint profile
    const profileRes = await axiosJWT.get("/profile", {
      headers: {
        Authorization: `Bearer ${response.data.accessToken}`,
      },
    });

    setName(profileRes.data.name);
    setEmail(profileRes.data.email);

  } catch (error) {
    if (error.response) {
      navigate("/");
    }
  }
};


  const axiosJWT = axios.create();

  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const response = await API.get("/token");
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwtDecode(response.data.accessToken);
        setName(decoded.name);
        setEmail(decoded.email);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const Logout = async () => {
    try {
      await API.delete("/logout");
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };


  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  return (
          <Navbar>
          <div className="relative isolate overflow-hidden bg-slate-700 py-6 sm:py-12">
            <form className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white rounded-lg m-10">
              <div className="space-y-12">
                <div className="border-b border-gray-900/10 pb-4">
                  <div className="flex justify-center item-center">
                    <h2 className="text-base font-semibold leading-7 text-gray-900">
                      Profile
                    </h2>
                  </div>

                  <div className="flex justify-center item-center border-b border-gray-900/10 pb-4">
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      This information will be displayed publicly so be careful
                      what you share.
                    </p>
                  </div>

                  <div className="flex items-center justify-center border-x-4 border-b border-gray-900/10 pb-4 col-span-full mt-5">
                    <div className="flex items-center justify-center flex-col col-span-full mt-0">
                      <label
                        htmlFor="photo"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Photo
                      </label>
                      <div className="mt-2">
                        <div className="w-20 mb-2 b-1 flex rounded-full shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md px-2 py-2">
                          {image ? <img src={image} alt="Profile" /> : <p>{image}</p>}
                        </div>
                      </div>

                      <input
                        type="file"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        onChange={handleFileChange}
                      />
                       <button onClick={handleSaveImage} className="mt-2 rounded-full bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Commit
            </button>
                    </div>
                  </div>

                  <div className="mt-5 border-x-4 border-b border-t border-gray-900/10 pb-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="ml-3 mr-3 mt-3 sm:col-span-4">
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Name
                      </label>
                      <div className="mt-2">
                        <div className="b-1 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md px-2 py-2">
                          <h1 className="mr-2 font-loader block text-sl font-medium leading-7 text-black">
                            {name}{" "}
                          </h1>
                        </div>
                      </div>
                    </div>

                    <div className="ml-3 mr-3 mt-0 mb-5 sm:col-span-4">
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Email
                      </label>
                      <div className="mt-2">
                        <div className="b-1 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md px-2 py-2">
                          <h1 className="mr-2 font-loader block text-sl font-medium leading-7 text-black">
                            {email}{" "}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-0 flex items-center justify-center gap-x-6">
                  <button
                    onClick={Logout}
                    type="submit"
                    className="rounded-full bg-red-600 flex justify-center lg:px-8  px-12 py-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </form>
          </div>
          </Navbar>
  );
};

export default Profile;
