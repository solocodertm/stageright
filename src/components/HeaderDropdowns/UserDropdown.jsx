'use client';
import { t } from '@/utils';
import React from 'react';
import { Dropdown } from 'antd';
import { FiUsers, FiChevronDown } from 'react-icons/fi';
import { IoMdArrowDropdown } from "react-icons/io";
const UserDropdown = ({ onLogin, onRegister }) => {
  const menuItems = [
    {
      key: 'register',
      label: (
        <div className="text-center">
          <h5 className="fw-semibold text-dark mb-2">{t('welcomeTo')} Vidaki!</h5>
          <hr className="my-2" />
          <button
            className="verf_email_add_btn mb-2"
            onClick={onRegister}
          >
            {t('createAccount')}
          </button>
          <div>
            {t('haveAccount')}?{' '}
            <a
              href="#"
              className="theme-primary-color fw-semibold"
              onClick={onLogin}
            >
              {t('logIn')}
            </a>
          </div>
        </div>
      ),
    },
  ];

  const dropdownProps = {
    menu: {
      items: menuItems,
    },
    placement: 'bottomRight',
    trigger: ['click'],
    overlayClassName: 'user-dropdown-menu',
  };

  return (
    <Dropdown {...dropdownProps} className="language_dropdown">
      <span className="d-flex align-items-center ">
        <FiUsers size={24} />
        <IoMdArrowDropdown />
      </span>
    </Dropdown>
  );
};

export default UserDropdown;
