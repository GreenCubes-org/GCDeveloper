$(document).ready(function () {
	$('.ui.dropdown').dropdown();
	$('.ui.accordion').accordion();
	$('.ui.checkbox').checkbox();
	$('#rightmenu').sticky({
		context: '#doccontent'
	});

	hljs.initHighlightingOnLoad();

	$('.message .close').on('click', function() {
		$(this).closest('.message').fadeOut();
	});

	$(document).on('click', '#gc-eaeditbutton', function (e) {
		var _this = this;
		var appid = $(_this).attr('appid');

		$('#gc-editappmodal').modal({
			onDeny: function () {
				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/' + appid,
							data: $('#gc-editappmodal form').serialize() + '&_csrf=' + csrfToken._csrf,
							error: function (data) {
								$('#gc-editappmodal .ui.form').addClass('error');

								$('#gc-editappmodal #errormessage').html('Произошла неизвестная ошибка, сообщите пожалуйста разработчику');
							},
							success: function (data) {
								if (data.message === 'ERROR') {
									$('#gc-editappmodal .ui.form').addClass('error');

									var message = "";

									switch (data.problemIn) {
										case 'name':
											message = 'Неправильный размер названия. Не более 100 символов и не менее одного символа.';
											break;

										case 'description':
											message = 'Неправильный размер краткого описания. Не более 100 символов и не менее одного символа.';
											break;

										case 'redirectURI':
											message = 'Некорректный URL в поле Callback';
											break;

										case 'homeURI':
											message = 'Некорректный URL в поле домашней страницы';
											break;

										case 'scope':
											message = 'Выберите, хотя бы, одно право';
											break;

										default:
											message = 'Произошла неизвестная ошибка, сообщите пожалуйста разработчику';
									}

									$('#gc-editappmodal #errormessage').html(message);
								}

								if (data.message === 'OK') {
									window.location.reload();
								}
							}
						});
					}
				});

				return true;
			},
			onShow: function () {
				$('#gc-editappmodal .ui.form').removeClass('error');

				$('#gc-editappmodal .content').css('height', $(window).height() - 200);
				$('#gc-editappmodal').css('margin-top','3em');
				$('#gc-editappmodal').css('top','0%');

				$.ajax({
					type: "GET",
					url: '/apps/' + appid,
					data: {},
					success: function (data) {
						$('#gc-editappmodal #ea-id').html(data.id);

						$('#gc-editappmodal input[name=name]').val(data.name);
						$('#gc-editappmodal #ea-name').html(data.name);

						$('#gc-editappmodal input[name=description]').val(data.description);

						if (data.internal) {
							$('#gc-editappmodal input[name=internal][value=true]').prop('checked', true);
						} else {
							$('#gc-editappmodal input[name=internal][value=false]').prop('checked', true);
						}
						$('#gc-editappmodal input[name=homeURI]').val(data.homeURI);
						$('#gc-editappmodal input[name=redirectURI]').val(data.redirectURI);

						var splitedScope = data.scope.split(',');

						splitedScope.forEach(function (element) {
							$('#gc-editappmodal input[name=' + element + ']').prop('checked', true);
						});
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-gnkbutton', function (e) {
		var _this = this;
		var appid = $(_this).attr('appid');

		$('#gc-generatenewkeymodal').modal({
			onDeny: function () {
				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/' + appid + '/regeneratekey',
							data: {
								_csrf: csrfToken._csrf
							},
							success: function (data) {
								$('#gc-generatenewkeymodal .header').html('Код успешно сгенерирован');
								$('#gc-generatenewkeymodal .content').html('<h3>Скопируйте его и храните в секрете:</h3><div class="ui transparent inverted input"><input value="' + data.newCode + '" style="width: 600px" readonly></div>');
								$('#gc-generatenewkeymodal .ui.buttons').removeClass('two');
								$('#gc-generatenewkeymodal .ui.buttons').html('<div class="ui green basic inverted button" id="gnk-exit"><i class="checkmark icon"></i> Хорошо</div>');

								$('#gc-generatenewkeymodal input').on("click", function () {
									$(this).select();
								});

								$(document).on('click', '#gnk-exit', function (e) {
									window.location.reload();

									return false;
								});
							}
						});
					}
				});

				return false;
			},
			onShow: function () {
				$.ajax({
					type: "GET",
					url: '/apps/' + appid,
					data: {},
					success: function (data) {
						$('#gc-generatenewkeymodal #gnk-name').html(data.name);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-dabutton', function (e) {
		var _this = this;
		var appid = $(_this).attr('appid');

		$('#gc-deleteappmodal').modal({
			onDeny: function () {

				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "DELETE",
							url: '/apps/' + appid,
							data: {
								_csrf: csrfToken._csrf
							},
							success: function (data) {
								if (data.message === 'OK') {
									window.location.reload();
								}
							},
							error: function (data) {
								alert(data);
							}
						});
					}
				});

				return false;
			},
			onShow: function () {
				$.ajax({
					type: "GET",
					url: '/apps/' + appid,
					data: {},
					success: function (data) {
						$('#gc-deleteappmodal #da-name').html(data.name);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-cobutton', function (e) {
		var _this = this;
		var appid = $(_this).attr('appid');

		$('#gc-changeownermodal').modal({
			onDeny: function () {

				return true;
			},
			onApprove: function () {
				if (!$('#gc-changeownermodal input#newOwner').val()) {
					alert("Введите никнейм нового владельца!");

					return false;
				}

				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/' + appid + '/changeowner',
							data: {
								newOwner: $('#gc-changeownermodal input#newOwner').val(),
								_csrf: csrfToken._csrf
							},
							success: function (data) {
								if (data.message === 'OK') {
									window.location.reload();
								}

								if (data.message === 'ERROR') {
									alert(data.error);
								}
							},
							error: function (data) {
								alert(data);
							}
						});
					}
				});

				return false;
			},
			onShow: function () {
				$('#gc-changeownermodal input#newOwner').val('');
				$.ajax({
					type: "GET",
					url: '/apps/' + appid,
					data: {},
					success: function (data) {
						$('#gc-changeownermodal #co-name').html(data.name);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-approverequestbutton', function (e) {
		var _this = this;
		var requestid = $(_this).attr('requestid');

		$('#gc-approverequestmodal').modal({
			onDeny: function () {

				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/requests/' + requestid + '/status',
							data: {
								status: 1,
								_csrf: csrfToken._csrf
							},
							success: function (data) {
								if (data.message === 'OK') {
									window.location.reload();
								}
							},
							error: function (data) {
								alert(data);
							}
						});
					}
				});

				return false;
			},
			onShow: function () {
				$.ajax({
					type: "GET",
					url: '/apps/requests/' + requestid,
					data: {},
					success: function (data) {
						$('#gc-approverequestmodal #ar-name').html(data.name);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-declinerequestbutton', function (e) {
		var _this = this;
		var requestid = $(_this).attr('requestid');

		$('#gc-declinerequestmodal').modal({
			onDeny: function () {

				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/requests/' + requestid + '/status',
							data: {
								status: 2,
								_csrf: csrfToken._csrf
							},
							success: function (data) {
								if (data.message === 'OK') {
									window.location.reload();
								}
							},
							error: function (data) {
								alert(data);
							}
						});
					}
				});

				return false;
			},
			onShow: function () {
				$.ajax({
					type: "GET",
					url: '/apps/requests/' + requestid,
					data: {},
					success: function (data) {
						$('#gc-declinerequestmodal #dr-name').html(data.name);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-editrequestbutton', function (e) {
		var _this = this;
		var requestid = $(_this).attr('requestid');

		$('#gc-editrequestmodal').modal({
			onDeny: function () {
				return true;
			},
			onApprove: function () {
				$.ajax({
					type: "GET",
					url: '/csrfToken',
					success: function (csrfToken) {
						$.ajax({
							type: "POST",
							url: '/apps/requests/' + requestid,
							data: $('#gc-editrequestmodal form').serialize() + '&_csrf=' + csrfToken._csrf,
							error: function (data) {
								$('#gc-editrequestmodal .ui.form').addClass('error');

								$('#gc-editrequestmodal #errormessage').html('Произошла неизвестная ошибка, сообщите пожалуйста разработчику');
							},
							success: function (data) {
								if (data.message === 'ERROR') {
									$('#gc-editrequestmodal .ui.form').addClass('error');

									var message = "";

									switch (data.problemIn) {
										case 'name':
											message = 'Неправильный размер названия. Не более 100 символов и не менее одного символа.';
											break;

										case 'description':
											message = 'Неправильный размер краткого описания. Не более 100 символов и не менее одного символа.';
											break;

										case 'redirectURI':
											message = 'Некорректный URL в поле Callback';
											break;

										case 'homeURI':
											message = 'Некорректный URL в поле домашней страницы';
											break;

										case 'scope':
											message = 'Выберите, хотя бы, одно право';
											break;

										default:
											message = 'Произошла неизвестная ошибка, сообщите пожалуйста разработчику';
									}

									$('#gc-editrequestmodal #errormessage').html(message);
								}

								if (data.message === 'OK') {
									window.location.reload();
								}
							}
						});
					}
				});

				return true;
			},
			onShow: function () {
				$('#gc-editrequestmodal .ui.form').removeClass('error');

				$('#gc-editrequestmodal .content').css('height', $(window).height() - 200);
				$('#gc-editrequestmodal').css('margin-top','3em');
				$('#gc-editrequestmodal').css('top','0%');

				$.ajax({
					type: "GET",
					url: '/apps/requests/' + requestid,
					data: {},
					success: function (data) {
						$('#gc-editrequestmodal #er-id').html(data.id);

						$('#gc-editrequestmodal input[name=name]').val(data.name);
						$('#gc-editrequestmodal #er-name').html(data.name);

						$('#gc-editrequestmodal input[name=description]').val(data.description);

						$('#gc-editrequestmodal input[name=homeURI]').val(data.homeURI);
						$('#gc-editrequestmodal input[name=redirectURI]').val(data.redirectURI);

						var splitedScope = data.scope.split(',');

						splitedScope.forEach(function (element) {
							$('#gc-editrequestmodal input[name=' + element + ']').prop('checked', true);
						});

						$('#gc-editrequestmodal textarea[name=message]').val(data.message);
					}
				});

				return true;
			}
		}).modal('show');

		return false;
	});

	$(document).on('click', '#gc-registerbutton', function (e) {
		if (!$('input[name=tos]').prop('checked')) {
			$('#gc-registerform .ui.form').addClass('error');

			$('#gc-registerform #errormessage').html('Примите соглашение пользователя');

			return;
		}

		$.ajax({
			type: "POST",
			url: '/apps/register',
			data: $('#gc-registerform').serialize(),
			error: function (data) {
				$('#gc-registerform .ui.form').addClass('error');

				$('#gc-registerform #errormessage').html('Произошла неизвестная ошибка, сообщите пожалуйста разработчику');
			},
			success: function (data) {
				if (data.message === 'ERROR') {
					$('#gc-registerform .ui.form').addClass('error');

					var message = "";

					switch (data.problemIn) {
						case 'name':
							message = 'Неправильный размер названия. Не более 100 символов и не менее одного символа.';
							break;

						case 'description':
							message = 'Неправильный размер краткого описания. Не более 100 символов и не менее одного символа.';
							break;

						case 'redirectURI':
							message = 'Некорректный URL в поле Callback';
							break;

						case 'homeURI':
							message = 'Некорректный URL в поле домашней страницы';
							break;

						case 'scope':
							message = 'Выберите, хотя бы, одно право';
							break;

						case 'message':
							message = 'Опишите для чего вам нужен доступ к API в поле "Подробное описание"';
							break;

						default:
							message = 'Произошла неизвестная ошибка, сообщите пожалуйста разработчику';
					}

					$('#gc-registerform #errormessage').html(message);
				}

				if (data.message === 'OK') {
					$('#gc-registerform')[0].reset();

					window.location = '/';
				}
			}
		});
	});

	$(document).on('click', '#gc-newbutton', function (e) {
		$.ajax({
			type: "POST",
			url: '/apps/new',
			data: $('#gc-newform').serialize(),
			error: function (data) {
				$('#gc-registerform .ui.form').addClass('error');

				$('#gc-registerform #errormessage').html('Произошла неизвестная ошибка, сообщите пожалуйста разработчику');
			},
			success: function (data) {
				console.log(data);
				if (data.message === 'ERROR') {
					$('#gc-registerform .ui.form').addClass('error');

					var message = "";

					switch (data.problemIn) {
						case 'name':
							message = 'Неправильный размер названия. Не более 100 символов и не менее одного символа.';
							break;

						case 'description':
							message = 'Неправильный размер краткого описания. Не более 100 символов и не менее одного символа.';
							break;

						case 'redirectURI':
							message = 'Некорректный URL в поле Callback';
							break;

						case 'homeURI':
							message = 'Некорректный URL в поле домашней страницы';
							break;

						case 'scope':
							message = 'Выберите, хотя бы, одно право';
							break;

						default:
							message = 'Произошла неизвестная ошибка, сообщите пожалуйста разработчику';
					}

					$('#gc-registerform #errormessage').html(message);
				}

				if (data.message === 'OK') {
					window.location = '/';
				}
			}
		});
	});
});
